// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar          from './components/Navbar'
import Home            from './pages/Home'
import Login           from './pages/Login'
import Signup          from './pages/Signup'
import Dashboard       from './pages/Dashboard'
import PropertyDetails from './pages/PropertyDetails'
import CreateProperty  from './pages/CreateProperty'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/"                element={<Home />} />
          <Route path="/login"           element={<Login />} />
          <Route path="/signup"          element={<Signup />} />
          <Route path="/dashboard"       element={<Dashboard />} />
          <Route path="/property/:id"    element={<PropertyDetails />} />
          <Route path="/create-property" element={<CreateProperty />} />
        </Routes>
        <footer className="footer">
          © {new Date().getFullYear()} Rent Now — Rental Marketplace. Built with Supabase + React.
        </footer>
      </BrowserRouter>
    </AuthProvider>
  )
}
