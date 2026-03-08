import { useState } from 'react'
import { lazy } from 'react';
import { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'

import ProtectedRoute from "./components/ProtectedRoute";
import RouteFallback from './components/fallback/RouteFallback.jsx'
import Profil from './components/Profil.jsx'

import Mail from './emails/Mail.jsx'
import ResetPasswordMail from './emails/ResetPasswordMail.jsx';
// Authentification
const Login = lazy(() => import('./pages/auth/Login.jsx'));
const RegisterCompany = lazy(() => import('./pages/auth/RegisterCompany.jsx'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword.jsx'));

const NotFound = lazy(() => import('./pages/NotFound.jsx'));
const WorkshopRunner = lazy(() => import('./workshops/WorkshopRunner.jsx'));

// Management et pages authorisées.
const Management = lazy(() => import('./pages/management/Management.jsx'));
const WorkshopInvitation = lazy(() => import('./pages/innovation/WorkshopInvitation.jsx'));
const Innovation = lazy(() => import('./pages/innovation/Innovation.jsx'));
const Team = lazy(() => import('./pages/team/Team.jsx'));

function App() {

  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterCompany />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        <Route path="/management" element={<ProtectedRoute><Management /></ProtectedRoute>} />
        <Route path="/innovation" element={<ProtectedRoute><Innovation /></ProtectedRoute>} />
        <Route path="/innovation/invitation" element={<ProtectedRoute><WorkshopInvitation /></ProtectedRoute>} />
        <Route path="/innovation/:workshopId/:id" element={<WorkshopRunner />} />
        <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App