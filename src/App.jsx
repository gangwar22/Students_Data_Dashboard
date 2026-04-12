import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Admin from './pages/Admin';
import StudentDashboard from './components/StudentDashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans">
        <Routes>
          {/* Default User Dashboard */}
          <Route path="/" element={<StudentDashboard />} />
          
          {/* Admin Dashboard with Login Security */}
          <Route path="/admin" element={<Admin />} />

          {/* Catch-all to User Dashboard */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
