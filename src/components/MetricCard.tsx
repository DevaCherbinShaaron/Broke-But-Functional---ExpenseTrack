type MetricCardProps = {
  label: string
  value: string
  detail: string
  accent?: boolean
}

export function MetricCard({ label, value, detail, accent = false }: MetricCardProps) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-sm text-stone-400">{label}</p>
      <p
        className={`mt-3 text-2xl font-semibold tracking-tight sm:text-3xl ${
          accent ? 'text-lime-300' : 'text-stone-100'
        }`}
      >
        {value}
      </p>
      <p className="mt-2 text-xs text-stone-500">{detail}</p>
    </article>
  )
}
