import { lazy } from 'react';
import { Suspense } from "react";
import { BrowserRouter, Outlet, Routes, Route } from "react-router-dom";
import './App.css'

import ProtectedRoute from "./components/ProtectedRoute";
import SectionRouteRedirect from "./components/SectionRouteRedirect.jsx";
import RouteFallback from './components/fallback/RouteFallback.jsx'
import {
  innovationLinks,
  managementLinks,
  teamLinks,
} from "./constants/navigationLinks.js";


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

          {/* Routes protégées */}
          <Route element={( <ProtectedRoute> <Outlet /> </ProtectedRoute> )}>

            {/* Innovation routes */}
            <Route path="/innovation" element={<SectionRouteRedirect links={innovationLinks} />} />
            <Route path="/innovation/ateliers" element={<Innovation />} />
            <Route path="/innovation/scheduled" element={<MyEvents />} />
            <Route path="/innovation/invitation" element={<WorkshopInvitation />} />
            <Route path="/innovation/:workshopId/:id" element={<WorkshopRunner />} />

            {/* Team routes */}
            <Route path="/team" element={<SectionRouteRedirect links={teamLinks} />} />
            <Route path="/team/annuaire" element={<Team />} />
            <Route path="/soon" element={<Soon />} />

            {/* Management routes */}
            <Route path="/management" element={<SectionRouteRedirect links={managementLinks} />} />
            <Route path="/management/comptes" element={<Management />} />
            <Route path="/management/abonnement" element={<Abonnement />} />
            
          </Route>

          {/* Template preview route */}

          {/* Pages publiques */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
