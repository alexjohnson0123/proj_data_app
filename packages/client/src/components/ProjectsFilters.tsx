import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ProjectType, ProjectsMeta } from '@/types/api'

export const ALL = '__all__'

export interface Filters {
  q: string
  client: string
  sphere: string
  projectType: string
  attr: Record<string, string>
}

interface Props {
  filters: Filters
  meta: ProjectsMeta | undefined
  projectTypes: ProjectType[]
  selectedType: ProjectType | undefined
  onFilter: (key: keyof Filters, raw: string) => void
  onAttr: (label: string, value: string) => void
}

export default function ProjectsFilters({ filters, meta, projectTypes, selectedType, onFilter, onAttr }: Props) {
  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Select value={filters.client || ALL} onValueChange={v => onFilter('client', v ?? ALL)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All clients</SelectItem>
            {meta?.clients.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.sphere || ALL} onValueChange={v => onFilter('sphere', v ?? ALL)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All spheres" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All spheres</SelectItem>
            {meta?.spheres.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.projectType || ALL} onValueChange={v => onFilter('projectType', v ?? ALL)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All project types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All project types</SelectItem>
            {projectTypes.map(pt => (
              <SelectItem key={pt.id} value={String(pt.id)}>{pt.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                onChange={e => onAttr(attr.label, e.target.value)}
                placeholder={attr.dataType}
              />
            </div>
          ))}
        </div>
      )}
    </>
  )
}
