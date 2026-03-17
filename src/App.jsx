import { lazy } from 'react';
import { Suspense } from "react";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import './App.css'

import ProtectedRoute from "./components/ProtectedRoute";
import RouteFallback from './components/fallback/RouteFallback.jsx'

import Mail from "./emails/Mail.jsx";

// Authentification
const Login = lazy(() => import('./pages/auth/Login.jsx'));
const RegisterCompany = lazy(() => import('./pages/auth/RegisterCompany.jsx'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword.jsx'));

const NotFound = lazy(() => import('./pages/NotFound.jsx'));

// Page utilisateur authentifié.
const WorkshopRunner = lazy(() => import('./workshops/WorkshopRunner.jsx'));
const MyEvents = lazy(() => import("./pages/innovation/MyEvents.jsx"));

// Management et pages authorisées.
const Management = lazy(() => import('./pages/management/Management.jsx'));
const Abonnement = lazy(() => import('./pages/management/Abonnement.jsx'));
const WorkshopInvitation = lazy(() => import('./pages/innovation/WorkshopInvitation.jsx'));
const Innovation = lazy(() => import('./pages/innovation/Innovation.jsx'));
const Team = lazy(() => import('./pages/Team.jsx'));
const Soon = lazy(() => import('./pages/Soon.jsx'));

function App() {

  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Authentification routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterCompany />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Innovation routes */}
        <Route path="/innovation" element={<ProtectedRoute><Navigate to="/innovation/accueil" replace /></ProtectedRoute>} />
        <Route path="/innovation/accueil" element={<ProtectedRoute><Innovation /></ProtectedRoute>} />
        <Route path="/innovation/scheduled" element={<ProtectedRoute><MyEvents /></ProtectedRoute>} />
        <Route path="/innovation/invitation" element={<ProtectedRoute><WorkshopInvitation /></ProtectedRoute>} />
        <Route path="/innovation/:workshopId/:id" element={<ProtectedRoute><WorkshopRunner /></ProtectedRoute>} />

        {/* Team routes */}
        <Route path="/team" element={<ProtectedRoute><Navigate to="/team/annuaire" replace /></ProtectedRoute>} />
        <Route path="/team/annuaire" element={<ProtectedRoute><Team /></ProtectedRoute>} />
        <Route path="/soon" element={<ProtectedRoute><Soon /></ProtectedRoute>} />

        {/* Management routes */}
        <Route path="/management" element={<ProtectedRoute><Navigate to="/management/comptes" replace /></ProtectedRoute>} />
        <Route path="/management/comptes" element={<ProtectedRoute><Management /></ProtectedRoute>} />
        <Route path="/management/abonnement" element={<ProtectedRoute><Abonnement /></ProtectedRoute>} />

        {/* Pages publiques */}
        <Route path="*" element={<NotFound />} />

        {/* Email template preview route */}
        <Route path="/preview-mail" element={<Mail />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
