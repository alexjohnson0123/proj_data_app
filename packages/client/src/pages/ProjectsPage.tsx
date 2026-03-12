import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getProjects, getProjectsMeta } from '@/api/projects'
import { getProjectTypes } from '@/api/projectTypes'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const ALL = '__all__'

interface Filters {
  q: string
  client: string
  sphere: string
  projectType: string
  attr: Record<string, string>
}

export default function ProjectsPage() {
  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState<Filters>({ q: '', client: '', sphere: '', projectType: '', attr: {} })

  const { data: meta } = useQuery({ queryKey: ['projects-meta'], queryFn: getProjectsMeta })
  const { data: projectTypes = [] } = useQuery({ queryKey: ['project-types'], queryFn: getProjectTypes })
  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects', filters],
    queryFn: () => getProjects(filters),
  })

  const selectedType = projectTypes.find(pt => pt._id === filters.projectType)
  const hasActiveFilters = filters.q || filters.client || filters.sphere || filters.projectType

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setFilters(f => ({ ...f, q: searchInput }))
  }

  function handleFilter(key: keyof Filters, raw: string) {
    const value = raw === ALL ? '' : raw
    setFilters(f => {
      const next = { ...f, [key]: value }
      if (key === 'projectType') next.attr = {}
      return next
    })
  }

  function handleAttr(label: string, value: string) {
    setFilters(f => ({ ...f, attr: { ...f.attr, [label]: value } }))
  }

  function clearFilters() {
    setSearchInput('')
    setFilters({ q: '', client: '', sphere: '', projectType: '', attr: {} })
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Projects</h1>

      {/* Text search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Search name, client, sphere, description..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="max-w-sm"
        />
        <Button type="submit">Search</Button>
        {hasActiveFilters && (
          <Button variant="ghost" type="button" onClick={clearFilters}>
            Clear
          </Button>
        )}
      </form>

      {/* Dropdown filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filters.client || ALL} onValueChange={v => handleFilter('client', v ?? ALL)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All clients</SelectItem>
            {meta?.clients.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.sphere || ALL} onValueChange={v => handleFilter('sphere', v ?? ALL)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All spheres" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All spheres</SelectItem>
            {meta?.spheres.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.projectType || ALL} onValueChange={v => handleFilter('projectType', v ?? ALL)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All project types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All project types</SelectItem>
            {projectTypes.map(pt => (
              <SelectItem key={pt._id} value={pt._id}>{pt.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Dynamic attribute filters (visible when project type is selected) */}
      {selectedType && selectedType.attributes.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-muted/50 rounded-md border">
          <span className="text-sm text-muted-foreground">Filter by attribute:</span>
          {selectedType.attributes.map(attr => (
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

      {/* Results */}
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
      )}
    </div>
  )
}
