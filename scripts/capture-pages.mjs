import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import process from 'node:process';

const PROJECT_ROOT = process.cwd();
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'docs', 'images');

function parseEnvFile(content) {
  const env = {};
  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

async function loadDotEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = await fs.readFile(filePath, 'utf8');
  const fileEnv = parseEnvFile(content);

  for (const [key, value] of Object.entries(fileEnv)) {
    if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
      process.env[key] = value;
    }
  }
}

async function walkFiles(dirPath, collected = []) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      await walkFiles(fullPath, collected);
      continue;
    }

    if (/\.(jsx?|tsx?)$/u.test(entry.name)) {
      collected.push(fullPath);
    }
  }

  return collected;
}

function extractRoutesFromSource(source) {
  const routes = [];
  const routeRegex = /<Route\b[^>]*\bpath\s*=\s*(?:"([^"]+)"|'([^']+)'|\{`([^`]+)`\})/gu;

  for (const match of source.matchAll(routeRegex)) {
    const route = (match[1] || match[2] || match[3] || '').trim();
    if (route) {
      routes.push(route);
    }
  }

  return routes;
}

function normalizeRoute(route) {
  if (!route || route === '*') {
    return null;
  }

  if (!route.startsWith('/')) {
    return `/${route}`;
  }

  return route;
}

function isDynamicRoute(route) {
  return route.includes(':') || route.includes('*');
}

function isLoginUrl(urlString, loginPath) {
  const url = new URL(urlString);
  const pathname = url.pathname.replace(/\/$/u, '') || '/';
  const normalizedLoginPath = loginPath.replace(/\/$/u, '') || '/';
  return pathname === normalizedLoginPath;
}

function sanitizeSegment(segment) {
  return segment
    .replace(/^:/u, 'param-')
    .replace(/[^a-zA-Z0-9._-]+/gu, '-')
    .replace(/-+/gu, '-')
    .replace(/^-|-$/gu, '') || 'index';
}

function routeToOutputPath(route) {
  const normalized = route.replace(/\/$/u, '');

  if (!normalized || normalized === '/') {
    return path.join(OUTPUT_DIR, 'index.png');
  }

  const segments = normalized
    .replace(/^\//u, '')
    .split('/')
    .map((segment) => sanitizeSegment(segment));

  const fileName = `${segments.pop()}.png`;
  return path.join(OUTPUT_DIR, ...segments, fileName);
}

async function ensureDirForFile(filePath) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

async function waitForHttpReady(url, timeoutMs = 45000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, { method: 'GET' });
      if (response.ok || response.status === 404) {
        return;
      }
    } catch {
      // server not ready yet
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Serveur indisponible après ${timeoutMs}ms: ${url}`);
}

function getRuntimeConfig() {
  return {
    baseUrl: process.env.SCREENSHOT_BASE_URL || 'http://127.0.0.1:4173',
    devCommand: process.env.SCREENSHOT_DEV_COMMAND || 'npm run dev -- --host 127.0.0.1 --port 4173',
    autoStartServer: process.env.SCREENSHOT_AUTO_START !== 'false',
    loginPath: process.env.SCREENSHOT_LOGIN_PATH || '/login',
    includeDynamicRoutes: process.env.SCREENSHOT_INCLUDE_DYNAMIC === 'true',
    extraRoutes: (process.env.SCREENSHOT_EXTRA_ROUTES || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    authEmail: process.env.SCREENSHOT_AUTH_EMAIL || '',
    authPassword: process.env.SCREENSHOT_AUTH_PASSWORD || '',
  };
}

async function discoverRoutes(config) {
  const sourceFiles = await walkFiles(SRC_DIR);
  const routes = new Set();

  for (const sourceFile of sourceFiles) {
    const content = await fs.readFile(sourceFile, 'utf8');
    const found = extractRoutesFromSource(content);

    for (const route of found) {
      const normalized = normalizeRoute(route);
      if (!normalized) {
        continue;
      }

      if (!config.includeDynamicRoutes && isDynamicRoute(normalized)) {
        continue;
      }

      routes.add(normalized);
    }
  }

  for (const route of config.extraRoutes) {
    const normalized = normalizeRoute(route);
    if (normalized) {
      routes.add(normalized);
    }
  }

  return [...routes].sort((a, b) => a.localeCompare(b));
}

async function performLogin(page, config) {
  if (!config.authEmail || !config.authPassword) {
    return false;
  }

  await page.goto(new URL(config.loginPath, config.baseUrl).toString(), { waitUntil: 'domcontentloaded' });

  await page.waitForSelector('input[name="email"]', { timeout: 15000 });
  await page.fill('input[name="email"]', config.authEmail);
  await page.click('button[aria-label="Continuer"]');

  await page.waitForSelector('input[name="password"]', { timeout: 15000 });
  await page.fill('input[name="password"]', config.authPassword);
  await page.click('button[aria-label="Se connecter"]');

  try {
    await page.waitForURL((url) => !isLoginUrl(url.toString(), config.loginPath), { timeout: 15000 });
  } catch {
    // Some apps stay on /login and update state asynchronously.
  }

  await page.waitForTimeout(1000);
  return !isLoginUrl(page.url(), config.loginPath);
}

async function captureRoutes() {
  await loadDotEnvFile(path.join(PROJECT_ROOT, '.env.local'));
  const config = getRuntimeConfig();

  const routes = await discoverRoutes(config);
  if (routes.length === 0) {
    throw new Error('Aucune route trouvée dans src/.');
  }

  console.log(`Routes découvertes (${routes.length}) :`);
  for (const route of routes) {
    console.log(`- ${route}`);
  }

  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    throw new Error(
      [
        'Playwright est requis pour les captures.',
        'Installez-le avec:',
        '  npm i -D playwright',
        '  npx playwright install chromium',
      ].join('\n')
    );
  }

  let devServerProcess;
  let browser;

  try {
    if (config.autoStartServer) {
      console.log(`Démarrage du serveur: ${config.devCommand}`);
      devServerProcess = spawn('/bin/zsh', ['-lc', config.devCommand], {
        cwd: PROJECT_ROOT,
        stdio: 'inherit',
      });

      await waitForHttpReady(config.baseUrl);
      console.log(`Serveur prêt sur ${config.baseUrl}`);
    }

    browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    const page = await context.newPage();

    const hasCredentials = Boolean(config.authEmail && config.authPassword);
    const loginRoute = normalizeRoute(config.loginPath) || '/login';
    const captured = [];
    const skipped = [];

    // Exception demandée: capturer /login avant toute connexion.
    if (routes.includes(loginRoute)) {
      try {
        console.log(`Capture invité ${loginRoute}`);
        await page.goto(new URL(loginRoute, config.baseUrl).toString(), { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1200);
        const outputPath = routeToOutputPath(loginRoute);
        await ensureDirForFile(outputPath);
        await page.screenshot({ path: outputPath, fullPage: true });
        captured.push({ route: loginRoute, outputPath });
      } catch (error) {
        skipped.push({ route: loginRoute, reason: error instanceof Error ? error.message : String(error) });
      }
    }

    let loggedIn = false;
    if (hasCredentials) {
      console.log('Tentative de login...');
      loggedIn = await performLogin(page, config);
      console.log(loggedIn ? 'Login réussi.' : 'Login non confirmé.');
    } else {
      console.log('Credentials absents: captures publiques uniquement.');
    }

    for (const route of routes) {
      if (route === loginRoute) {
        continue;
      }

      const targetUrl = new URL(route, config.baseUrl).toString();
      console.log(`Capture ${route}`);

      try {
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

        if (!loggedIn && hasCredentials && isLoginUrl(page.url(), config.loginPath) && route !== config.loginPath) {
          loggedIn = await performLogin(page, config);
          if (loggedIn) {
            await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
          }
        }

        if (isLoginUrl(page.url(), config.loginPath) && route !== config.loginPath && !loggedIn) {
          skipped.push({ route, reason: 'Route protégée sans authentification valide' });
          continue;
        }

        await page.waitForTimeout(1200);

        const outputPath = routeToOutputPath(route);
        await ensureDirForFile(outputPath);
        await page.screenshot({ path: outputPath, fullPage: true });
        captured.push({ route, outputPath });
      } catch (error) {
        skipped.push({ route, reason: error instanceof Error ? error.message : String(error) });
      }
    }

    console.log('\nCaptures générées :');
    for (const item of captured) {
      console.log(`- ${item.route} -> ${path.relative(PROJECT_ROOT, item.outputPath)}`);
    }

    if (skipped.length > 0) {
      console.log('\nRoutes ignorées/échouées :');
      for (const item of skipped) {
        console.log(`- ${item.route}: ${item.reason}`);
      }
    }
  } finally {
    if (browser) {
      await browser.close();
    }

    if (devServerProcess) {
      devServerProcess.kill('SIGTERM');
    }
  }
}

captureRoutes().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
