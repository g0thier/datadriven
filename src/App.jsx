import { useState } from 'react'
import './App.css'

import Navbar from './components/Navbar.jsx'
import Profil from './components/Profil.jsx'
import StepTime from './components/StepTime.jsx'

import Login from './pages/Login.jsx'
import Mail from './pages/Mail.jsx'
import Workshop from './pages/Workshop.jsx'

import Innovation from './pages/innovation/Innovation.jsx'
import Step1 from './pages/innovation/paper-brain/Step1.jsx'
import Team from './pages/team/Team.jsx'
import Step2 from './pages/innovation/paper-brain/Step2.jsx'
import Step3 from './pages/innovation/paper-brain/Step3.jsx'
import Step4 from './pages/innovation/paper-brain/Step4.jsx'




function TemplateLogin() {
  return (
    <>
      <Login />
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

function TemplateMail() {
  return (
    <>
      <Mail />
    </>
  );
}

function TemplateActivity() {
  return (
    <>
      <StepTime />
      <Step4 />
    </>
  );
}

function App() {

  return (
    <>
      <TemplateActivity />
    </>
  )
}

export default App