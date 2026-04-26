import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import Layout from './components/Layout';
import OrganizationList from './pages/OrganizationList';
import Dashboard from './pages/Dashboard';
import ProjectDashboard from './pages/ProjectDashboard';
import Projects from './pages/Projects';
import Environments from './pages/Environments';
import Tenants from './pages/Tenants';

function OrgLayout() {
  const { orgId } = useParams<{ orgId: string }>();
  return <Layout orgId={Number(orgId)} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<OrganizationList />} />
        </Route>
        <Route path="/org/:orgId" element={<OrgLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects/:projectId/dashboard" element={<ProjectDashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="environments" element={<Environments />} />
          <Route path="tenants" element={<Tenants />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
