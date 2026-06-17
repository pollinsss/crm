import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchEvents, createEvent, completeEvent, type EventFilters } from '../api/schedule'

export function useEvents(filters: EventFilters) {
  return useQuery({
    queryKey: ['schedule', filters],
    queryFn: () => fetchEvents(filters),
    enabled: !!filters.date_from && !!filters.date_to,
  })
}

export function useCreateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedule'] })
    },
  })
}

export function useCompleteEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: completeEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedule'] })
    },
  })
}