import { useState } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'

import Navbar from './components/Navbar.jsx'
import Profil from './components/Profil.jsx'
import StepTime from './components/StepTime.jsx'

import Mail from './emails/Mail.jsx'
import ResetPasswordMail from './emails/ResetPasswordMail.jsx';

import Login from './pages/Login.jsx'
import RegisterCompany from './pages/RegisterCompany.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import NotFound from './pages/NotFound.jsx'
import Workshop from './pages/Workshop.jsx'

import Innovation from './pages/innovation/Innovation.jsx'
import Team from './pages/team/Team.jsx'
import Step1 from './pages/innovation/paper-brain/Step1.jsx'
import Step2 from './pages/innovation/paper-brain/Step2.jsx'
import Step3 from './pages/innovation/paper-brain/Step3.jsx'
import Step4 from './pages/innovation/paper-brain/Step4.jsx'
import Step5 from './pages/innovation/paper-brain/Step5.jsx'





function TemplateLogin() {
  return (
    <>
      <Login />
    </>
  );
}

function TemplateNotFound() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="*" element={<NotFound code={"FAIL"} />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

function TemplateTeam() {
  return (
    <>
      <Navbar />
      <Team />
    </>
  );
}

function TemplateInnovation() {
  return (
    <>
      <Navbar />
      <Innovation />
    </>
  );
}

function TemplateWorkshop() {
  return (
    <>
      <Navbar />
      <Workshop />
    </>
  );
}

function TemplateProfil() {
  return (
    <>
      <Navbar />
      <Profil />
      <Innovation />
    </>
  );
}

function TemplateRegister() {
  return (
    <>
      <RegisterCompany />
    </>
  );
}

function TemplateMail() {
  return (
    <>
      <Mail />
    </>
  );
}

function TemplateResetPasswordMail() {
  return (
    <>
      <ResetPasswordMail />
    </>
  );
}

function TemplateResetPassword() {
  return (
    <>
      <ResetPassword />
    </>
  );
}

function TemplateActivity() {
  return (
    <>
      <StepTime />
      <Step5 />
    </>
  );
}

function App() {

  return (
    <>
      <TemplateRegister />
    </>
  )
}

export default App