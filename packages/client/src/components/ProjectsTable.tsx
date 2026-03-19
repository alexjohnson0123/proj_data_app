import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Project } from '@/types/api'

interface Props {
  projects: Project[]
  isLoading: boolean
  error: Error | null
}

export default function ProjectsTable({ projects, isLoading, error }: Props) {
  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading...</p>
  }

  return (
    <>
      <p className="text-sm text-muted-foreground">
        {projects.length} project{projects.length !== 1 ? 's' : ''}
      </p>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Sphere</TableHead>
              <TableHead>Project Type</TableHead>
              <TableHead>Start Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-destructive py-10">
                  Could not load projects — {error.message}
                </TableCell>
              </TableRow>
            ) : projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                  No projects found.
                </TableCell>
              </TableRow>
            ) : projects.map(p => (
              <TableRow key={p.workdayId}>
                <TableCell>
                  <Link
                    to={`/projects/${p.workdayId}`}
                    className="font-medium hover:underline"
                  >
                    {p.name || p.workdayId}
                  </Link>
                </TableCell>
                <TableCell>{p.client || '—'}</TableCell>
                <TableCell>{p.sphere || '—'}</TableCell>
                <TableCell>
                  {p.projectType
                    ? <Badge variant="secondary">{p.projectType.name}</Badge>
                    : <span className="text-muted-foreground">—</span>
                  }
                </TableCell>
                <TableCell>
                  {p.startDate ? new Date(p.startDate).toLocaleDateString() : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
