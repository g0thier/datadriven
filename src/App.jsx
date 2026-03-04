import { useState } from 'react'
import { lazy } from 'react';
import { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'

import RouteFallback from './components/fallback/RouteFallback.jsx'
import Profil from './components/Profil.jsx'
import StepTime from './components/StepTime.jsx'

import Mail from './emails/Mail.jsx'
import ResetPasswordMail from './emails/ResetPasswordMail.jsx';

const Login = lazy(() => import('./pages/Login.jsx'));
const RegisterCompany = lazy(() => import('./pages/RegisterCompany.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));
const Workshop = lazy(() => import('./pages/Workshop.jsx'));
const Innovation = lazy(() => import('./pages/innovation/Innovation.jsx'));
const Team = lazy(() => import('./pages/team/Team.jsx'));
const Step1 = lazy(() => import('./pages/innovation/paper-brain/Step1.jsx'));
const Step2 = lazy(() => import('./pages/innovation/paper-brain/Step2.jsx'));
const Step3 = lazy(() => import('./pages/innovation/paper-brain/Step3.jsx'));
const Step4 = lazy(() => import('./pages/innovation/paper-brain/Step4.jsx'));
const Step5 = lazy(() => import('./pages/innovation/paper-brain/Step5.jsx'));

function App() {

  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<RegisterCompany />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profil" element={<Profil />} />
        <Route path="/step-time" element={<StepTime />} />
        <Route path="/workshop" element={<Workshop />} />
        <Route path="/innovation" element={<Innovation />} />
        <Route path="/team" element={<Team />} />
        <Route path="/innovation/paper-brain/step1" element={<Step1 />} />
        <Route path="/innovation/paper-brain/step2" element={<Step2 />} />
        <Route path="/innovation/paper-brain/step3" element={<Step3 />} />
        <Route path="/innovation/paper-brain/step4" element={<Step4 />} />
        <Route path="/innovation/paper-brain/step5" element={<Step5 />} />
        <Route path="/mail" element={<Mail />} />
        <Route path="/reset-password-mail" element={<ResetPasswordMail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App