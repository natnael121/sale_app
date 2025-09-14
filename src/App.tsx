import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './components/auth/Login';
import Layout from './components/layout/Layout';
import AdminDashboard from './components/dashboard/AdminDashboard';
import SupervisorDashboard from './components/dashboard/SupervisorDashboard';
import CallCenterDashboard from './components/dashboard/CallCenterDashboard';
import FieldAgentDashboard from './components/dashboard/FieldAgentDashboard';
import LeadList from './components/leads/LeadList';
import MeetingList from './components/meetings/MeetingList';
import OrganizationList from './components/organizations/OrganizationList';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const getDashboardComponent = () => {
    switch (user.role) {
      case 'admin': return <AdminDashboard user={user} />;
      case 'supervisor': return <SupervisorDashboard user={user} />;
      case 'call_center': return <CallCenterDashboard user={user} />;
      case 'field_agent': return <FieldAgentDashboard user={user} />;
      default: return <AdminDashboard user={user} />;
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout user={user} />}>
          <Route index element={getDashboardComponent()} />
          <Route path="organizations" element={<OrganizationList user={user} />} />
          <Route path="leads" element={<LeadList user={user} />} />
          <Route path="meetings" element={<MeetingList user={user} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;