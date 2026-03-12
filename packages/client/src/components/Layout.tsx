import { NavLink, Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-background px-6 h-14 flex items-center gap-6">
        <span className="font-semibold text-foreground mr-4">Project Data</span>
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
      </nav>
      <main className="p-6 max-w-6xl mx-auto">
        <Outlet />
      </main>
    </div>
  )
}
