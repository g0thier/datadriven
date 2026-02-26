import { useState } from 'react'
import './App.css'
import Header from './components/Navbar.jsx'
import Settings from './components/Profil.jsx'  
import Login from './pages/Login.jsx'
import Innovation from './pages/innovation/Innovation.jsx'
import Workshop from './pages/Workshop.jsx'
import Navbar from './components/Navbar.jsx'
import Profil from './components/Profil.jsx'
import Team from './pages/team/Team.jsx'

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

function App() {

  return (
    <>
      <TemplateWorkshop />
    </>
  )
}

export default App
