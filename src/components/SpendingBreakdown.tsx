import { formatRupees } from '../lib/formatRupees'
import type { FinanceMetrics } from '../features/finance/finance'

type SpendingBreakdownProps = {
  spendingByCategory: FinanceMetrics['spendingByCategory']
  totalSpent: number
}

export function SpendingBreakdown({
  spendingByCategory,
  totalSpent,
}: SpendingBreakdownProps) {
  return (
    <section
      aria-labelledby="breakdown-heading"
      className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6"
    >
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-lime-300">
        Where it goes
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight" id="breakdown-heading">
        Spending breakdown
      </h2>
      {spendingByCategory.length === 0 ? (
        <p className="mt-5 text-sm leading-6 text-stone-500">
          Your categories will show up here once you log an expense.
        </p>
      ) : (
        <ul className="mt-5 space-y-4">
          {spendingByCategory.map(({ category, amount }) => {
            const percent = totalSpent > 0 ? (amount / totalSpent) * 100 : 0
            return (
              <li key={category}>
                <div className="mb-2 flex justify-between gap-3 text-sm">
                  <span className="text-stone-300">{category}</span>
                  <span className="tabular-nums text-stone-400">
                    {formatRupees(amount)}
                  </span>
                </div>
                <div
                  aria-label={`${category}: ${Math.round(percent)}% of spending`}
                  className="h-1.5 overflow-hidden rounded-full bg-white/10"
                  role="img"
                >
                  <div
                    className="h-full rounded-full bg-lime-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
