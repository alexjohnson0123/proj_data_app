import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import AuthGuard from './components/AuthGuard.jsx'
import ProjectsPage from './pages/ProjectsPage.jsx'
import ProjectDetailPage from './pages/ProjectDetailPage.jsx'
import ProjectTypesPage from './pages/ProjectTypesPage.jsx'
import EngagementTypesPage from './pages/EngagementTypesPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

export default function App() {
  return (
    <AuthGuard>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="project-types" element={<ProjectTypesPage />} />
          <Route path="engagement-types" element={<EngagementTypesPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AuthGuard>
  )
}
