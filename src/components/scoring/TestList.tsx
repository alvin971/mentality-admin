// src/components/scoring/TestList.tsx
import { cn } from '@/utils/cn'
import { Badge } from '@/components/ui/Badge'
import { WAIS_TESTS, INDEX_COLORS, type CompositeIndex } from '@/types'
import type { TestConfiguration } from '@/types'

interface TestListProps {
  configurations: TestConfiguration[]
  selectedTestId: string | null
  onSelect: (testId: string) => void
}

export function TestList({ configurations, selectedTestId, onSelect }: TestListProps) {
  const configuredIds = new Set(configurations.map(c => c.test_id))

  const grouped = WAIS_TESTS.reduce<Record<CompositeIndex, typeof WAIS_TESTS>>(
    (acc, t) => {
      if (!acc[t.index]) acc[t.index] = []
      acc[t.index].push(t)
      return acc
    },
    {} as Record<CompositeIndex, typeof WAIS_TESTS>
  )

  return (
    <div className="w-56 flex-shrink-0 flex flex-col gap-4">
      {(Object.entries(grouped) as [CompositeIndex, typeof WAIS_TESTS][]).map(([index, tests]) => (
        <div key={index}>
          <div className="px-2 mb-1.5">
            <Badge variant={INDEX_COLORS[index] as 'blue' | 'gray' | 'green' | 'orange' | 'red'}>
              {index}
            </Badge>
          </div>
          <div className="space-y-0.5">
            {tests.map(test => {
              const isConfigured = configuredIds.has(test.id)
              const isSelected = selectedTestId === test.id
              return (
                <button
                  key={test.id}
                  onClick={() => onSelect(test.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors',
                    isSelected
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-clinical-subtle hover:text-clinical-text hover:bg-gray-50'
                  )}
                >
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full flex-shrink-0',
                      isConfigured ? 'bg-emerald-500' : 'bg-orange-400'
                    )}
                  />
                  {test.name}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
