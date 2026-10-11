import { formatRupees } from '../lib/formatRupees'
import { MONTHLY_BUDGET, type FinanceMetrics } from '../features/finance/finance'

type MonthlyForecastProps = {
  metrics: FinanceMetrics
}

export function MonthlyForecast({ metrics }: MonthlyForecastProps) {
  const forecastWidth = Math.min(100, (metrics.forecast / MONTHLY_BUDGET) * 100)

  return (
    <section
      aria-labelledby="forecast-heading"
      className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6"
    >
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-lime-300">
        At this pace
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight" id="forecast-heading">
        Month forecast
      </h2>
      <p className="mt-5 text-sm text-stone-400">Estimated spend by day 30</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-stone-100">
        {formatRupees(metrics.forecast)}
      </p>
      <div className="mt-4 space-y-1.5 text-sm text-stone-400">
        <p className="flex justify-between gap-3">
          <span>Actual expenses</span>
          <span className="tabular-nums">{formatRupees(metrics.totalSpent)}</span>
        </p>
        <p className="flex justify-between gap-3">
          <span>Future subscription bills</span>
          <span className="tabular-nums">
            {formatRupees(metrics.subscriptionCommitments)}
          </span>
        </p>
        <p className="flex justify-between gap-3">
          <span>Future discretionary estimate</span>
          <span className="tabular-nums">
            {formatRupees(metrics.projectedFutureDiscretionary)}
          </span>
        </p>
      </div>
      {metrics.subscriptionCommitments > 0 && (
        <p className="mt-2 text-sm text-amber-200">
          Includes {formatRupees(metrics.subscriptionCommitments)} in upcoming
          subscriptions
        </p>
      )}
      <div
        aria-label={`${Math.round(forecastWidth)}% of budget forecast`}
        className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"
        role="img"
      >
        <div
          className={`h-full rounded-full ${
            metrics.forecast > MONTHLY_BUDGET ? 'bg-rose-300' : 'bg-lime-300'
          }`}
          style={{ width: `${forecastWidth}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-stone-500">
        <span>₹0</span>
        <span>Budget {formatRupees(MONTHLY_BUDGET)}</span>
      </div>
      <p className="mt-4 text-sm leading-6 text-stone-400">
        {metrics.riskAssessment.reason}
      </p>
      <p className="mt-2 text-xs leading-5 text-stone-500">
        Estimate = expenses already recorded + upcoming active subscription
        commitments + projected future discretionary spending. The discretionary
        estimate uses the median daily spend from completed days and only starts
        after 7 days of history. Until then it assumes no additional discretionary
        spend. Unexpected expenses are treated as one-time costs, not a daily
        pattern. This is a cautious estimate, not a guarantee.
      </p>
    </section>
  )
}
