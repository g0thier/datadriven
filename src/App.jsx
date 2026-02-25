import { useState } from 'react'
import './App.css'
import Header from './components/Navbar.jsx'
import Settings from './components/Profil.jsx'  
import Login from './pages/Login.jsx'
import Innovation from './pages/innovation/Innovation.jsx'
import Navbar from './components/Navbar.jsx'
import Profil from './components/Profil.jsx'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        {/* <Login />*/}
        <Navbar />
        <Profil />
        <Innovation />
      </div>
    </>
  )
}

export default App
