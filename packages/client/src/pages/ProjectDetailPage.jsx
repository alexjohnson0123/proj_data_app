import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProject, assignProjectType, addAttribute, updateAttribute } from '@/api/projects'
import { getProjectTypes } from '@/api/projectTypes'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function ProjectDetailPage() {
  const { id } = useParams()
  const qc = useQueryClient()

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProject(id),
  })
  const { data: projectTypes = [] } = useQuery({
    queryKey: ['project-types'],
    queryFn: getProjectTypes,
  })

  const [assignOpen, setAssignOpen] = useState(false)
  const [addAttrOpen, setAddAttrOpen] = useState(false)
  const [editAttr, setEditAttr] = useState(null) // { name, value }

  const invalidate = () => qc.invalidateQueries({ queryKey: ['project', id] })

  const assignTypeMutation = useMutation({
    mutationFn: ({ projectTypeId, clearAttributes }) =>
      assignProjectType(id, projectTypeId, clearAttributes),
    onSuccess: () => { invalidate(); setAssignOpen(false) },
  })

  const addAttrMutation = useMutation({
    mutationFn: ({ name, value }) => addAttribute(id, name, value),
    onSuccess: () => { invalidate(); setAddAttrOpen(false) },
  })

  const editAttrMutation = useMutation({
    mutationFn: ({ oldName, name, value }) => updateAttribute(id, oldName, name, value),
    onSuccess: () => { invalidate(); setEditAttr(null) },
  })

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading...</p>
  if (error) return <p className="text-destructive text-sm">Error: {error.message}</p>

  const attrs = project.attributes ? Object.entries(project.attributes) : []
  const typeAttrs = project.projectType?.attributes ?? []
  const setAttrNames = new Set(attrs.map(([name]) => name))
  const availableAttrs = typeAttrs.filter(a => !setAttrNames.has(a.label))

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Projects
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-semibold">{project.name || project.workdayId}</h1>
          <Badge variant="outline" className="font-mono text-xs">{project.workdayId}</Badge>
        </div>
      </div>

      {/* Static fields */}
      <div className="rounded-md border p-5 grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
        <InfoField label="Client" value={project.client} />
        <InfoField label="Sphere" value={project.sphere} />
        <InfoField
          label="Start Date"
          value={project.startDate ? new Date(project.startDate).toLocaleDateString() : null}
        />
        {project.description && (
          <div className="col-span-2">
            <p className="text-muted-foreground mb-0.5">Description</p>
            <p>{project.description}</p>
          </div>
        )}
      </div>

      {/* Project type */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold">Project Type</h2>
          <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)}>
            {project.projectType ? 'Change' : 'Assign'}
          </Button>
        </div>
        <div className="rounded-md border p-4 text-sm">
          {project.projectType
            ? <Badge>{project.projectType.name}</Badge>
            : <span className="text-muted-foreground">No project type assigned.</span>
          }
        </div>
      </section>

      {/* Attributes */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold">Attributes</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAddAttrOpen(true)}
            disabled={!project.projectType || availableAttrs.length === 0}
          >
            + Add
          </Button>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
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
              ) : attrs.map(([name, value]) => (
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
        key={addAttrOpen}
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
          editAttrMutation.mutate({ oldName: editAttr.name, name, value })
        }
      />
    </div>
  )
}

function InfoField({ label, value }) {
  return (
    <div>
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p>{value || '—'}</p>
    </div>
  )
}

function AssignTypeDialog({ open, onOpenChange, projectTypes, hasAttributes, isPending, error, onSubmit }) {
  const [projectTypeId, setProjectTypeId] = useState('')
  const [clearAttributes, setClearAttributes] = useState(false)

  function handleSubmit(e) {
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
            <Select value={projectTypeId} onValueChange={setProjectTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project type" />
              </SelectTrigger>
              <SelectContent>
                {projectTypes.map(pt => (
                  <SelectItem key={pt._id} value={pt._id}>{pt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasAttributes && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-md border border-amber-200 text-sm">
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

function AddAttributeDialog({ open, onOpenChange, availableAttrs, isPending, error, onSubmit }) {
  const [selectedLabel, setSelectedLabel] = useState('')
  const [value, setValue] = useState('')
  const attrDef = availableAttrs.find(a => a.label === selectedLabel)

  function handleSubmit(e) {
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
            <Select value={selectedLabel} onValueChange={v => { setSelectedLabel(v); setValue('') }}>
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

function EditAttributeDialog({ attr, onOpenChange, typeAttrs, isPending, error, onSubmit }) {
  const [value, setValue] = useState(String(attr?.value ?? ''))
  const attrDef = typeAttrs.find(a => a.label === attr?.name)

  function handleSubmit(e) {
    e.preventDefault()
    const castValue = attrDef?.dataType === 'number' ? Number(value) : value
    onSubmit({ name: attr.name, value: castValue })
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
