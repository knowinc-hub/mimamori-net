import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger'

const styles: Record<Variant, string> = {
  primary:
    'bg-teal-700 text-white hover:bg-teal-800 active:bg-teal-900 disabled:bg-slate-300',
  secondary:
    'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 active:bg-slate-100 disabled:text-slate-400',
  quiet: 'text-teal-800 hover:bg-teal-50 active:bg-teal-100 disabled:text-slate-400',
  danger:
    'border border-red-200 bg-red-50 text-red-800 hover:bg-red-100 active:bg-red-200',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

/** タップ領域44px以上を保証した共通ボタン */
export function Button({ variant = 'secondary', className = '', children, ...rest }: Props) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-4 text-base font-medium transition-colors disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
