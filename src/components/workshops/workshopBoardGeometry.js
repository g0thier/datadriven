/**
 * @module components/workshops/workshopBoardGeometry
 * @description Shared geometry helpers for draggable/voting workshop boards.
 */

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function buildGridPosition(index = 0, config = {}) {
  const columns = Number.isFinite(config?.columns) && config.columns > 0 ? config.columns : 5;
  const startX = Number.isFinite(config?.startX) ? config.startX : 40;
  const startY = Number.isFinite(config?.startY) ? config.startY : 40;
  const gapX = Number.isFinite(config?.gapX) ? config.gapX : 290;
  const gapY = Number.isFinite(config?.gapY) ? config.gapY : 220;

  const col = index % columns;
  const row = Math.floor(index / columns);

  return {
    x: startX + col * gapX,
    y: startY + row * gapY,
  };
}

export function normalizePosition(position = {}, fallback = buildGridPosition(0)) {
  const x = Number(position?.x);
  const y = Number(position?.y);

  return {
    x: Number.isFinite(x) ? x : fallback.x,
    y: Number.isFinite(y) ? y : fallback.y,
  };
}
