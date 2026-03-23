import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEngagementTypes, createEngagementType, renameEngagementType } from '@/api/engagementTypes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'
import type { EngagementType } from '@/types/api'

export default function EngagementTypesPage() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editingType, setEditingType] = useState<EngagementType | null>(null)

  const { data: engagementTypes = [], isLoading } = useQuery({
    queryKey: ['engagement-types'],
    queryFn: getEngagementTypes,
  })

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading...</p>

  const onSuccess = () => qc.invalidateQueries({ queryKey: ['engagement-types'] })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Engagement Types</h1>
        {isAdmin && <Button onClick={() => setCreateOpen(true)}>Create Engagement Type</Button>}
      </div>

      {engagementTypes.length === 0 ? (
        <p className="text-muted-foreground text-sm">No engagement types defined.</p>
      ) : (
        <div className="grid gap-3">
          {engagementTypes.map(et => (
            <div key={et.id} className="rounded-md border p-5 flex items-center justify-between">
              <span className="font-semibold">{et.name}</span>
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => setEditingType(et)}>
                  Edit
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <CreateEngagementTypeDialog
        key={String(createOpen)}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={onSuccess}
      />

      {editingType && (
        <EditEngagementTypeDialog
          key={editingType.id}
          engagementType={editingType}
          onOpenChange={open => { if (!open) setEditingType(null) }}
          onSuccess={() => { onSuccess(); setEditingType(null) }}
        />
      )}
    </div>
  )
}

interface CreateEngagementTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

function CreateEngagementTypeDialog({ open, onOpenChange, onSuccess }: CreateEngagementTypeDialogProps) {
  const [name, setName] = useState('')

  const mutation = useMutation({
    mutationFn: createEngagementType,
    onSuccess: () => { onSuccess(); onOpenChange(false) },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Engagement Type</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={e => { e.preventDefault(); mutation.mutate(name) }}
          className="space-y-5 mt-2"
        >
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Owner's Rep, Master Planning"
              autoFocus
            />
          </div>
          {mutation.error && <p className="text-sm text-destructive">{mutation.error.message}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!name.trim() || mutation.isPending}>
              {mutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface EditEngagementTypeDialogProps {
  engagementType: EngagementType
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

function EditEngagementTypeDialog({ engagementType, onOpenChange, onSuccess }: EditEngagementTypeDialogProps) {
  const [name, setName] = useState(engagementType.name)

  const mutation = useMutation({
    mutationFn: () => renameEngagementType(engagementType.name, name.trim()),
    onSuccess,
  })

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Engagement Type</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          {mutation.error && <p className="text-sm text-destructive">{mutation.error.message}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={!name.trim() || name === engagementType.name || mutation.isPending}
            >
              {mutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
