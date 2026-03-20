import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProjectTypes, createProjectType } from '@/api/projectTypes'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'
import type { AttributeDefInput, DataType } from '@proj/shared'

export default function ProjectTypesPage() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)

  const { data: projectTypes = [], isLoading } = useQuery({
    queryKey: ['project-types'],
    queryFn: getProjectTypes,
  })

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading...</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Project Types</h1>
        {isAdmin && <Button onClick={() => setCreateOpen(true)}>Create Project Type</Button>}
      </div>

      {projectTypes.length === 0 ? (
        <p className="text-muted-foreground text-sm">No project types defined.</p>
      ) : (
        <div className="grid gap-3">
          {projectTypes.map(pt => (
            <div key={pt.id} className="rounded-md border p-5">
              <h2 className="font-semibold mb-3">{pt.name}</h2>
              {pt.attributeDefs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attributes defined.</p>
              ) : (
                <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 gap-y-2 text-sm max-w-lg">
                  <span className="text-muted-foreground font-medium">Label</span>
                  <span className="text-muted-foreground font-medium">Type</span>
                  <span className="text-muted-foreground font-medium">Required</span>
                  {pt.attributeDefs.map(a => (
                    <>
                      <span key={a.label}>{a.label}</span>
                      <Badge variant="outline" className="justify-self-start">{a.dataType}</Badge>
                      <span>{a.required ? 'Yes' : '—'}</span>
                    </>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <CreateProjectTypeDialog
        key={String(createOpen)}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => qc.invalidateQueries({ queryKey: ['project-types'] })}
      />
    </div>
  )
}

interface CreateProjectTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

function CreateProjectTypeDialog({ open, onOpenChange, onSuccess }: CreateProjectTypeDialogProps) {
  const [name, setName] = useState('')
  const [attrs, setAttrs] = useState<AttributeDefInput[]>([])
  const [newLabel, setNewLabel] = useState('')
  const [newDataType, setNewDataType] = useState<DataType>('string')
  const [newRequired, setNewRequired] = useState(false)

  const mutation = useMutation({
    mutationFn: createProjectType,
    onSuccess: () => {
      onSuccess()
      onOpenChange(false)
    },
  })

  function addAttr() {
    if (!newLabel.trim()) return
    setAttrs(a => [...a, { label: newLabel.trim(), dataType: newDataType, required: newRequired }])
    setNewLabel('')
    setNewDataType('string')
    setNewRequired(false)
  }

  function removeAttr(label: string) {
    setAttrs(a => a.filter(attr => attr.label !== label))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate({ name, attributes: attrs })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Project Type</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-2">

          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Construction, Consulting"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Attributes</Label>

            {attrs.length > 0 && (
              <div className="rounded-md border divide-y text-sm mb-2">
                {attrs.map(attr => (
                  <div key={attr.label} className="flex items-center justify-between px-3 py-2">
                    <span>{attr.label}</span>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{attr.dataType}</Badge>
                      {attr.required && <span className="text-muted-foreground text-xs">required</span>}
                      <button
                        type="button"
                        onClick={() => removeAttr(attr.label)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 items-center">
              <Input
                className="flex-1"
                placeholder="Label"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAttr() } }}
              />
              <Select value={newDataType} onValueChange={v => setNewDataType(v as DataType)}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="checkbox"
                  id="newRequired"
                  checked={newRequired}
                  onChange={e => setNewRequired(e.target.checked)}
                />
                <label htmlFor="newRequired" className="text-sm">Req.</label>
              </div>
              <Button type="button" variant="outline" onClick={addAttr} disabled={!newLabel.trim()}>
                Add
              </Button>
            </div>
          </div>

          {mutation.error && <p className="text-sm text-destructive">{mutation.error.message}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || mutation.isPending}>
              {mutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
