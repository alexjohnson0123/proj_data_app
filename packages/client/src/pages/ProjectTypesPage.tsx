import { useQuery } from '@tanstack/react-query'
import { getProjectTypes } from '@/api/projectTypes'
import { Badge } from '@/components/ui/badge'

export default function ProjectTypesPage() {
  const { data: projectTypes = [], isLoading } = useQuery({
    queryKey: ['project-types'],
    queryFn: getProjectTypes,
  })

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading...</p>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Project Types</h1>

      {projectTypes.length === 0 ? (
        <p className="text-muted-foreground text-sm">No project types defined.</p>
      ) : (
        <div className="grid gap-3">
          {projectTypes.map(pt => (
            <div key={pt._id} className="rounded-md border p-5">
              <h2 className="font-semibold mb-3">{pt.name}</h2>
              {pt.attributes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attributes defined.</p>
              ) : (
                <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 gap-y-2 text-sm max-w-lg">
                  <span className="text-muted-foreground font-medium">Label</span>
                  <span className="text-muted-foreground font-medium">Type</span>
                  <span className="text-muted-foreground font-medium">Required</span>
                  {pt.attributes.map(a => (
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
    </div>
  )
}
