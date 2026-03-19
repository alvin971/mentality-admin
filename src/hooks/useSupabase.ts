// src/hooks/useSupabase.ts
import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface QueryState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: { message: string } | null }>
) {
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }))
    const { data, error } = await queryFn()
    setState({
      data,
      loading: false,
      error: error ? error.message : null,
    })
    return { data, error }
  }, [queryFn])

  return { ...state, execute }
}

export function useSupabaseMutation<TInput, TOutput>(
  mutationFn: (input: TInput) => Promise<{ data: TOutput | null; error: { message: string } | null }>
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(async (input: TInput) => {
    setLoading(true)
    setError(null)
    const result = await mutationFn(input)
    if (result.error) setError(result.error.message)
    setLoading(false)
    return result
  }, [mutationFn])

  return { mutate, loading, error }
}

export { supabase }
