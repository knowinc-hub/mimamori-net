import { useId, type ReactNode } from 'react'

interface FieldProps {
  label: string
  hint?: string
  error?: string
  optional?: boolean
  children: (props: {
    id: string
    'aria-invalid': boolean
    'aria-describedby': string | undefined
  }) => ReactNode
}

/**
 * label・ヒント・インラインエラーを備えたフォームフィールド。
 * すべての入力はこれで包み、label 無しの入力を作らない（WCAG対応）。
 */
export function Field({ label, hint, error, optional, children }: FieldProps) {
  const id = useId()
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(' ')
  return (
    <div className="mb-5">
      <label htmlFor={id} className="mb-1.5 block text-base font-medium text-slate-900">
        {label}
        {optional && <span className="ml-2 text-sm font-normal text-slate-500">任意</span>}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mb-1.5 text-sm text-slate-600">
          {hint}
        </p>
      )}
      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': describedBy || undefined,
      })}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}

export const inputClass = (hasError?: boolean) =>
  `w-full rounded-xl border bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 ${
    hasError ? 'border-red-400' : 'border-slate-300'
  }`
