interface Props {
  label: string
  description?: string
  checked: boolean
  onChange: (next: boolean) => void
}

/** アクセシブルなスイッチ（role="switch"・44px タップ領域） */
export function Toggle({ label, description, checked, onChange }: Props) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-4 py-2">
      <div>
        <p className="text-base text-slate-900">{label}</p>
        {description && <p className="text-sm text-slate-600">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-teal-700' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
            checked ? 'left-7' : 'left-1'
          }`}
        />
        <span className="sr-only">{checked ? 'オン' : 'オフ'}</span>
      </button>
    </div>
  )
}
