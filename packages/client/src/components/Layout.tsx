import { NavLink, Outlet } from 'react-router-dom'
import logo from '@/assets/images/Catalyst 2025.png'

export default function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-background px-6 h-14 flex items-center gap-6">
        <div className="flex items-center gap-2 mr-4">
          <img src={logo} alt="Catalyst" className="h-7 w-auto" />
          <span className="text-lg font-semibold text-foreground">Project Data</span>
        </div>
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive
              ? 'text-sm font-medium text-foreground'
              : 'text-sm text-muted-foreground hover:text-foreground transition-colors'
          }
        >
          Projects
        </NavLink>
        <NavLink
          to="/project-types"
          className={({ isActive }) =>
            isActive
              ? 'text-sm font-medium text-foreground'
              : 'text-sm text-muted-foreground hover:text-foreground transition-colors'
          }
        >
          Project Types
        </NavLink>
        <NavLink
          to="/engagement-types"
          className={({ isActive }) =>
            isActive
              ? 'text-sm font-medium text-foreground'
              : 'text-sm text-muted-foreground hover:text-foreground transition-colors'
          }
        >
          Engagement Types
        </NavLink>
      </nav>
      <main className="p-6 max-w-6xl mx-auto">
        <Outlet />
      </main>
    </div>
  )
}
