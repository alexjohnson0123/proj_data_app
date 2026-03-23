import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getProjects, getProjectsMeta } from '@/api/projects'
import { getProjectTypes } from '@/api/projectTypes'

export const ALL = '__all__'

export interface Filters {
  q: string
  client: string
  sphere: string
  projectType: string
  attr: Record<string, { op: string; value: string }>
}

const EMPTY_FILTERS: Filters = { q: '', client: '', sphere: '', projectType: '', attr: {} }

export function useProjectFilters() {
  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)

  const { data: meta } = useQuery({ queryKey: ['projects-meta'], queryFn: getProjectsMeta })
  const { data: projectTypes = [] } = useQuery({ queryKey: ['project-types'], queryFn: getProjectTypes })
  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects', filters],
    queryFn: () => getProjects(filters),
  })

  const selectedType = projectTypes.find(pt => String(pt.id) === filters.projectType)
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

  function handleAttr(label: string, op: string, value: string) {
    setFilters(f => ({ ...f, attr: { ...f.attr, [label]: { op, value } } }))
  }

  function clearFilters() {
    setSearchInput('')
    setFilters(EMPTY_FILTERS)
  }

  return {
    searchInput, setSearchInput,
    filters, meta, projectTypes, projects,
    isLoading, error,
    selectedType, hasActiveFilters,
    handleSearch, handleFilter, handleAttr, clearFilters,
  }
}
