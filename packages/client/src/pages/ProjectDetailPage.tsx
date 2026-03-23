import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProject, assignProjectType, addAttribute, updateAttribute, addEngagementType, removeEngagementType } from '@/api/projects'
import { getProjectTypes } from '@/api/projectTypes'
import { getEngagementTypes } from '@/api/engagementTypes'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { AttributeDefinition, EngagementType, ProjectType } from '@/types/api'

interface EditAttr {
  name: string
  value: unknown
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProject(id!),
  })
  const { data: projectTypes = [] } = useQuery({
    queryKey: ['project-types'],
    queryFn: getProjectTypes,
  })
  const { data: allEngagementTypes = [] } = useQuery({
    queryKey: ['engagement-types'],
    queryFn: getEngagementTypes,
  })

  const [assignOpen, setAssignOpen] = useState(false)
  const [addAttrOpen, setAddAttrOpen] = useState(false)
  const [editAttr, setEditAttr] = useState<EditAttr | null>(null)
  const [addEngagementOpen, setAddEngagementOpen] = useState(false)

  const invalidate = () => qc.invalidateQueries({ queryKey: ['project', id] })

  const assignTypeMutation = useMutation({
    mutationFn: ({ projectTypeId, clearAttributes }: { projectTypeId: string; clearAttributes: boolean }) =>
      assignProjectType(id!, Number(projectTypeId), clearAttributes),
    onSuccess: () => { invalidate(); setAssignOpen(false) },
  })

  const addAttrMutation = useMutation({
    mutationFn: ({ name, value }: { name: string; value: string | number }) => addAttribute(id!, name, value),
    onSuccess: () => { invalidate(); setAddAttrOpen(false) },
  })

  const editAttrMutation = useMutation({
    mutationFn: ({ oldName, name, value }: { oldName: string; name: string; value: string | number }) =>
      updateAttribute(id!, oldName, name, value),
    onSuccess: () => { invalidate(); setEditAttr(null) },
  })

  const addEngagementMutation = useMutation({
    mutationFn: (name: string) => addEngagementType(id!, name),
    onSuccess: () => { invalidate(); setAddEngagementOpen(false) },
  })

  const removeEngagementMutation = useMutation({
    mutationFn: (name: string) => removeEngagementType(id!, name),
    onSuccess: invalidate,
  })

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading...</p>
  if (error) return <p className="text-destructive text-sm">Error: {error.message}</p>

  const typeAttrs = project!.projectType?.attributeDefs ?? []
  const attrs = (project!.attributeValues ?? []).map(av => {
    const def = typeAttrs.find(d => d.id === av.attributeDefinitionId)
    return { name: def?.label ?? '', value: av.valueString ?? av.valueNumber ?? av.valueDate ?? '' }
  })
  const setAttrNames = new Set(attrs.map(a => a.name))
  const availableAttrs = typeAttrs.filter(a => !setAttrNames.has(a.label))
  const assignedEngagementNames = new Set((project!.engagementTypes ?? []).map(e => e.name))
  const availableEngagementTypes = allEngagementTypes.filter(e => !assignedEngagementNames.has(e.name))

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Projects
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-semibold">{project!.name || project!.workdayId}</h1>
          <Badge variant="outline" className="font-mono text-xs">{project!.workdayId}</Badge>
        </div>
      </div>

      {/* Static fields */}
      <div className="rounded-md border p-5 grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
        <InfoField label="Client" value={project!.client} />
        <InfoField label="Sphere" value={project!.sphere} />
        <InfoField label="Region" value={project!.region} />
        <InfoField
          label="Start Date"
          value={project!.startDate ? new Date(project!.startDate).toLocaleDateString() : null}
        />
        {project!.description && (
          <div className="col-span-2">
            <p className="text-muted-foreground mb-0.5">Description</p>
            <p>{project!.description}</p>
          </div>
        )}
      </div>

      {/* Project type + Attributes */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold flex items-center gap-2">
            Project Type{project!.projectType && <>: <Badge>{project!.projectType.name}</Badge></>}
          </h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)}>
              {project!.projectType ? 'Change' : 'Assign'}
            </Button>
            {project!.projectType && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAddAttrOpen(true)}
                disabled={availableAttrs.length === 0}
              >
                + Add
              </Button>
            )}
          </div>
        </div>
        {!project!.projectType ? (
          <p className="text-sm text-muted-foreground">No project type assigned.</p>
        ) : (
          <div className="rounded-md border">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="text-sm font-semibold">Attributes</span>
            </div>
            <div className="p-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="font-bold">
                      <TableHead>Name</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead className="w-20" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attrs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                          No attributes set.
                        </TableCell>
                      </TableRow>
                    ) : attrs.map(({ name, value }) => (
                      <TableRow key={name}>
                        <TableCell className="font-medium">{name}</TableCell>
                        <TableCell>{String(value)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => setEditAttr({ name, value })}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Engagement Types */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold">Engagement Types</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAddEngagementOpen(true)}
            disabled={availableEngagementTypes.length === 0}
          >
            + Add
          </Button>
        </div>
        {(project!.engagementTypes ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No engagement types assigned.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(project!.engagementTypes ?? []).map(et => (
              <Badge key={et.id} variant="secondary" className="flex items-center gap-1.5 pr-1">
                {et.name}
                <button
                  onClick={() => removeEngagementMutation.mutate(et.name)}
                  className="text-muted-foreground hover:text-destructive transition-colors leading-none"
                >
                  ✕
                </button>
              </Badge>
            ))}
          </div>
        )}
      </section>

      {/* Dialogs */}
      <AssignTypeDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        projectTypes={projectTypes}
        hasAttributes={attrs.length > 0}
        isPending={assignTypeMutation.isPending}
        error={assignTypeMutation.error}
        onSubmit={({ projectTypeId, clearAttributes }) =>
          assignTypeMutation.mutate({ projectTypeId, clearAttributes })
        }
      />

      <AddAttributeDialog
        key={String(addAttrOpen)}
        open={addAttrOpen}
        onOpenChange={setAddAttrOpen}
        availableAttrs={availableAttrs}
        isPending={addAttrMutation.isPending}
        error={addAttrMutation.error}
        onSubmit={({ name, value }) => addAttrMutation.mutate({ name, value })}
      />

      <EditAttributeDialog
        key={editAttr?.name}
        attr={editAttr}
        onOpenChange={open => { if (!open) setEditAttr(null) }}
        typeAttrs={typeAttrs}
        isPending={editAttrMutation.isPending}
        error={editAttrMutation.error}
        onSubmit={({ name, value }) =>
          editAttrMutation.mutate({ oldName: editAttr!.name, name, value })
        }
      />

      <AddEngagementTypeDialog
        key={String(addEngagementOpen)}
        open={addEngagementOpen}
        onOpenChange={setAddEngagementOpen}
        availableEngagementTypes={availableEngagementTypes}
        isPending={addEngagementMutation.isPending}
        error={addEngagementMutation.error}
        onSubmit={name => addEngagementMutation.mutate(name)}
      />
    </div>
  )
}

interface InfoFieldProps {
  label: string
  value: string | null | undefined
}

function InfoField({ label, value }: InfoFieldProps) {
  return (
    <div>
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p>{value || '—'}</p>
    </div>
  )
}

interface AssignTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectTypes: ProjectType[]
  hasAttributes: boolean
  isPending: boolean
  error: Error | null
  onSubmit: (data: { projectTypeId: string; clearAttributes: boolean }) => void
}

function AssignTypeDialog({ open, onOpenChange, projectTypes, hasAttributes, isPending, error, onSubmit }: AssignTypeDialogProps) {
  const [projectTypeId, setProjectTypeId] = useState('')
  const [clearAttributes, setClearAttributes] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ projectTypeId, clearAttributes })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Project Type</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Project Type</Label>
            <Select value={projectTypeId} onValueChange={v => setProjectTypeId(v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project type">
                  {projectTypes.find(pt => String(pt.id) === projectTypeId)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {projectTypes.map(pt => (
                  <SelectItem key={pt.id} value={String(pt.id)} textValue={pt.name}>{pt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasAttributes && (
            <div className="flex items-start gap-2 p3 bg-amber-50 rounded-md border border-amber-200 text-sm">
              <input
                type="checkbox"
                id="clearAttrs"
                className="mt-0.5"
                checked={clearAttributes}
                onChange={e => setClearAttributes(e.target.checked)}
              />
              <label htmlFor="clearAttrs" className="leading-snug">
                Clear existing attribute data (required to change project type)
              </label>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error.message}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!projectTypeId || (hasAttributes && !clearAttributes) || isPending}
            >
              {isPending ? 'Saving...' : 'Assign'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface AddAttributeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableAttrs: AttributeDefinition[]
  isPending: boolean
  error: Error | null
  onSubmit: (data: { name: string; value: string | number }) => void
}

function AddAttributeDialog({ open, onOpenChange, availableAttrs, isPending, error, onSubmit }: AddAttributeDialogProps) {
  const [selectedLabel, setSelectedLabel] = useState('')
  const [value, setValue] = useState('')
  const attrDef = availableAttrs.find(a => a.label === selectedLabel)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const castValue = attrDef?.dataType === 'number' ? Number(value) : value
    onSubmit({ name: selectedLabel, value: castValue })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Attribute</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Attribute</Label>
            <Select value={selectedLabel} onValueChange={v => { setSelectedLabel(v ?? ''); setValue('') }}>
              <SelectTrigger>
                <SelectValue placeholder="Select an attribute" />
              </SelectTrigger>
              <SelectContent>
                {availableAttrs.map(a => (
                  <SelectItem key={a.label} value={a.label}>
                    {a.label}
                    <span className="ml-1.5 text-muted-foreground text-xs">({a.dataType})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedLabel && (
            <div className="space-y-1.5">
              <Label>Value</Label>
              <Input
                type={attrDef?.dataType === 'number' ? 'number' : 'text'}
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder={`Enter ${attrDef?.dataType} value`}
                autoFocus
              />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error.message}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedLabel || value === '' || isPending}>
              {isPending ? 'Saving...' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface AddEngagementTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableEngagementTypes: EngagementType[]
  isPending: boolean
  error: Error | null
  onSubmit: (name: string) => void
}

function AddEngagementTypeDialog({ open, onOpenChange, availableEngagementTypes, isPending, error, onSubmit }: AddEngagementTypeDialogProps) {
  const [selected, setSelected] = useState('')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Engagement Type</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Engagement Type</Label>
            <Select value={selected} onValueChange={v => setSelected(v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="Select an engagement type" />
              </SelectTrigger>
              <SelectContent>
                {availableEngagementTypes.map(et => (
                  <SelectItem key={et.id} value={et.name}>{et.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error.message}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={() => onSubmit(selected)} disabled={!selected || isPending}>
              {isPending ? 'Adding...' : 'Add'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface EditAttributeDialogProps {
  attr: EditAttr | null
  onOpenChange: (open: boolean) => void
  typeAttrs: AttributeDefinition[]
  isPending: boolean
  error: Error | null
  onSubmit: (data: { name: string; value: string | number }) => void
}

function EditAttributeDialog({ attr, onOpenChange, typeAttrs, isPending, error, onSubmit }: EditAttributeDialogProps) {
  const [value, setValue] = useState(String(attr?.value ?? ''))
  const attrDef = typeAttrs.find(a => a.label === attr?.name)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const castValue = attrDef?.dataType === 'number' ? Number(value) : value
    onSubmit({ name: attr!.name, value: castValue })
  }

  return (
    <Dialog open={!!attr} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Attribute</DialogTitle>
        </DialogHeader>
        {attr && (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>{attr.name}</Label>
              <Input
                type={attrDef?.dataType === 'number' ? 'number' : 'text'}
                value={value}
                onChange={e => setValue(e.target.value)}
                autoFocus
              />
            </div>

            {error && <p className="text-sm text-destructive">{error.message}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
