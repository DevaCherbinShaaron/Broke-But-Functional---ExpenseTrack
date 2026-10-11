import type { FinancialRiskAssessment } from '../features/finance/finance'
import { formatRupees } from '../lib/formatRupees'

type FinancialRiskCardProps = {
  assessment: FinancialRiskAssessment
  simulated?: boolean
}

const riskStyles = {
  'On track': 'border-lime-300/20 bg-lime-300/10 text-lime-200',
  'Watch spending': 'border-amber-300/20 bg-amber-300/10 text-amber-200',
  'At risk': 'border-orange-300/20 bg-orange-300/10 text-orange-200',
  'Budget shortfall': 'border-rose-300/20 bg-rose-300/10 text-rose-200',
}

export function FinancialRiskCard({
  assessment,
  simulated = false,
}: FinancialRiskCardProps) {
  return (
    <section
      aria-label={`${simulated ? 'Simulated ' : ''}financial risk assessment: ${assessment.status}`}
      className={`rounded-3xl border p-5 sm:p-6 ${riskStyles[assessment.status]}`}
      role="status"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] opacity-80">
            {simulated ? 'Preview risk' : 'Financial risk'}
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            {assessment.status}
          </h2>
        </div>
        {assessment.amount !== undefined && (
          <span className="text-sm font-medium tabular-nums">
            {assessment.status === 'Budget shortfall'
              ? `${formatRupees(assessment.amount)} short`
              : `${formatRupees(assessment.amount)} available`}
          </span>
        )}
      </div>
      <p className="mt-3 text-sm leading-6 text-stone-200">{assessment.reason}</p>
      <p className="mt-2 text-sm leading-6 text-stone-300">
        <span className="font-semibold">What may help: </span>
        {assessment.action}
      </p>
    </section>
  )
}
