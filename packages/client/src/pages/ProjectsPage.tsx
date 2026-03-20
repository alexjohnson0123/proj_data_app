import { Link } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useProjectFilters, ALL } from '@/hooks/useProjectFilters'

export default function ProjectsPage() {
  const {
    searchInput, setSearchInput,
    filters, meta, projectTypes, projects,
    isLoading, error,
    selectedType, hasActiveFilters,
    handleSearch, handleFilter, handleAttr, clearFilters,
  } = useProjectFilters()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Projects</h1>

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Search name, client, sphere, description..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="max-w-sm"
        />
        <Button type="submit">Search</Button>
        {hasActiveFilters && (
          <Button variant="ghost" type="button" onClick={clearFilters}>Clear</Button>
        )}
      </form>

      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Client</label>
          <Select value={filters.client} onValueChange={v => handleFilter('client', v ?? '')}>
            <SelectTrigger className="min-w-44 w-auto">
              <SelectValue placeholder="All clients" />
            </SelectTrigger>
            <SelectContent className="w-auto">
              <SelectItem value={ALL}>All clients</SelectItem>
              {meta?.clients.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Sphere</label>
          <Select value={filters.sphere} onValueChange={v => handleFilter('sphere', v ?? '')}>
            <SelectTrigger className="min-w-44 w-auto">
              <SelectValue placeholder="All spheres" />
            </SelectTrigger>
            <SelectContent className="w-auto">
              <SelectItem value={ALL}>All spheres</SelectItem>
              {meta?.spheres.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Project Type</label>
          <Select value={filters.projectType} onValueChange={v => handleFilter('projectType', v ?? '')}>
            <SelectTrigger className="min-w-48 w-auto">
              <SelectValue placeholder="All project types">
                {projectTypes.find(pt => String(pt.id) === filters.projectType)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="w-auto">
              <SelectItem value={ALL}>All project types</SelectItem>
              {projectTypes.map(pt => (
                <SelectItem key={pt.id} value={String(pt.id)}>{pt.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedType && selectedType.attributeDefs.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-muted/50 rounded-md border">
          <span className="text-sm text-muted-foreground">Filter by attribute:</span>
          {selectedType.attributeDefs.map(attr => (
            <div key={attr.label} className="flex items-center gap-1.5">
              <label className="text-sm">{attr.label}</label>
              <Input
                className="w-32 h-8 text-sm"
                type={attr.dataType === 'number' ? 'number' : 'text'}
                value={filters.attr[attr.label] ?? ''}
                onChange={e => handleAttr(attr.label, e.target.value)}
                placeholder={attr.dataType}
              />
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold text-foreground">Name</TableHead>
                  <TableHead className="font-semibold text-foreground">Client</TableHead>
                  <TableHead className="font-semibold text-foreground">Sphere</TableHead>
                  <TableHead className="font-semibold text-foreground">Region</TableHead>
                  <TableHead className="font-semibold text-foreground">Project Type</TableHead>
                  <TableHead className="font-semibold text-foreground">Start Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-destructive py-10">
                      Could not load projects — {error.message}
                    </TableCell>
                  </TableRow>
                ) : projects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                      No projects found.
                    </TableCell>
                  </TableRow>
                ) : projects.map(p => (
                  <TableRow key={p.workdayId}>
                    <TableCell>
                      <Link to={`/projects/${p.workdayId}`} className="font-medium hover:underline">
                        {p.name || p.workdayId}
                      </Link>
                    </TableCell>
                    <TableCell className="font-normal">{p.client || '—'}</TableCell>
                    <TableCell className="font-normal">{p.sphere || '—'}</TableCell>
                    <TableCell className="font-normal">{p.region || '—'}</TableCell>
                    <TableCell className="font-normal">
                      {p.projectType
                        ? <Badge variant="secondary">{p.projectType.name}</Badge>
                        : <span className="text-muted-foreground">—</span>
                      }
                    </TableCell>
                    <TableCell className="font-normal">
                      {p.startDate ? new Date(p.startDate).toLocaleDateString() : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
