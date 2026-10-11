import { useMemo, useState, type FormEvent } from 'react'
import {
  calculateMetrics,
  getToday,
  type Expense,
  type FinancialRiskStatus,
  type Subscription,
} from '../features/finance/finance'
import { formatRupees } from '../lib/formatRupees'
import { MetricCard } from './MetricCard'

type MoneyDecisionSimulatorProps = {
  actualExpenses: Expense[]
  subscriptions: Subscription[]
  actualMetrics: ReturnType<typeof calculateMetrics>
  startDate: string
  onCommit: (expense: Expense) => void
}

type Proposal = {
  amount: number
  description: string
}

const healthStyles: Record<FinancialRiskStatus, string> = {
  'On track': 'border-lime-300/20 bg-lime-300/10 text-lime-200',
  'Watch spending': 'border-amber-300/20 bg-amber-300/10 text-amber-200',
  'At risk': 'border-orange-300/20 bg-orange-300/10 text-orange-200',
  'Budget shortfall': 'border-rose-300/20 bg-rose-300/10 text-rose-200',
}

export function MoneyDecisionSimulator({
  actualExpenses,
  subscriptions,
  actualMetrics,
  startDate,
  onCommit,
}: MoneyDecisionSimulatorProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [error, setError] = useState<string | null>(null)

  const simulatedMetrics = useMemo(() => {
    if (!proposal) return null
    const simulatedExpense: Expense = {
      id: 'uncommitted-simulation',
      amount: proposal.amount,
      category: 'Shopping',
      description: proposal.description,
      date: getToday(),
    }
    return calculateMetrics(
      [...actualExpenses, simulatedExpense],
      startDate,
      undefined,
      subscriptions,
    )
  }, [actualExpenses, proposal, startDate, subscriptions])

  const hasSufficientFunds =
    proposal !== null && proposal.amount <= actualMetrics.remaining

  function previewPurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedAmount = Number(amount)
    const trimmedDescription = description.trim()

    if (!Number.isSafeInteger(parsedAmount) || parsedAmount <= 0) {
      setError('Enter a whole-rupee amount greater than ₹0.')
      setProposal(null)
      return
    }
    if (!trimmedDescription) {
      setError('Add a short description for this purchase.')
      setProposal(null)
      return
    }

    setError(null)
    setProposal({ amount: parsedAmount, description: trimmedDescription })
  }

  function cancelSimulation() {
    setAmount('')
    setDescription('')
    setProposal(null)
    setError(null)
  }

  function commitPurchase() {
    if (!proposal || !hasSufficientFunds) return

    onCommit({
      id: crypto.randomUUID(),
      amount: proposal.amount,
      category: 'Shopping',
      description: proposal.description,
      date: getToday(),
    })
    cancelSimulation()
  }

  return (
    <section
      aria-labelledby="simulator-heading"
      className="rounded-3xl border border-lime-300/15 bg-lime-300/[0.035] p-5 sm:p-6"
    >
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-lime-300">
          Pause before you pay
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight" id="simulator-heading">
          Before you spend
        </h2>
        <p className="mt-2 text-sm leading-6 text-stone-400">
          Try a purchase against your current plan. Nothing changes until you commit it.
        </p>
      </div>

      <form className="grid gap-4 sm:grid-cols-[0.7fr_1fr_auto]" onSubmit={previewPurchase}>
        <label className="block text-sm text-stone-300" htmlFor="simulation-amount">
          Proposed amount
          <span className="relative mt-2 block">
            <span aria-hidden="true" className="absolute left-3 top-2.5 text-stone-500">
              ₹
            </span>
            <input
              aria-describedby={error ? 'simulation-error' : undefined}
              className="w-full rounded-xl border border-white/10 bg-[#10130f] py-2.5 pl-8 pr-3 text-stone-100 placeholder:text-stone-600"
              id="simulation-amount"
              inputMode="numeric"
              min="1"
              onChange={(event) => setAmount(event.target.value)}
              placeholder="e.g. 1,200"
              required
              step="1"
              type="number"
              value={amount}
            />
          </span>
        </label>
        <label className="block text-sm text-stone-300" htmlFor="simulation-description">
          What are you thinking of buying?
          <input
            aria-describedby={error ? 'simulation-error' : undefined}
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#10130f] px-3 py-2.5 text-stone-100 placeholder:text-stone-600"
            id="simulation-description"
            maxLength={80}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="e.g. New headphones"
            required
            value={description}
          />
        </label>
        <button
          className="self-end rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-stone-200 transition hover:bg-white/[0.06]"
          type="submit"
        >
          Preview purchase
        </button>
      </form>

      {error && (
        <p className="mt-3 text-sm text-rose-300" id="simulation-error" role="alert">
          {error}
        </p>
      )}

      {proposal && simulatedMetrics && (
        <div
          aria-label="Simulated purchase outcome"
          className="mt-6 rounded-2xl border border-white/10 bg-[#10130f]/70 p-4 sm:p-5"
          role="region"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-amber-200">
                Simulation only · not yet spent
              </p>
              <p className="mt-2 text-sm font-medium text-stone-100">
                {proposal.description} · {formatRupees(proposal.amount)}
              </p>
            </div>
            <div
              aria-label={`Simulated financial health: ${simulatedMetrics.riskAssessment.status}`}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${healthStyles[simulatedMetrics.riskAssessment.status]}`}
              role="status"
            >
              Simulated: {simulatedMetrics.riskAssessment.status}
            </div>
          </div>

          <p className="mb-3 mt-5 text-xs text-stone-500">
            Simulated values · your actual dashboard and saved expenses are unchanged
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              accent
              detail="If you make this purchase"
              label="Remaining balance"
              value={formatRupees(simulatedMetrics.remaining)}
            />
            <MetricCard
              accent
              detail={`Across the next ${simulatedMetrics.daysRemaining} days`}
              label="Safe to spend daily"
              value={formatRupees(simulatedMetrics.safeToSpend)}
            />
            <MetricCard
              detail={`Actual forecast: ${formatRupees(actualMetrics.forecast)}`}
              label="Projected month spend"
              value={formatRupees(simulatedMetrics.forecast)}
            />
            <MetricCard
              detail={`Actual status: ${actualMetrics.health}`}
              label="Financial health"
              value={simulatedMetrics.health}
            />
          </div>

          {!hasSufficientFunds && (
            <p className="mt-4 text-sm text-rose-200" role="alert">
              This purchase is more than your available balance of{' '}
              {formatRupees(Math.max(0, actualMetrics.remaining))}. It cannot be
              committed from this plan.
            </p>
          )}

          <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-stone-300 transition hover:bg-white/[0.06]"
              onClick={cancelSimulation}
              type="button"
            >
              Cancel simulation
            </button>
            <button
              className="rounded-xl bg-lime-300 px-4 py-2.5 text-sm font-semibold text-[#10130f] transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:bg-stone-700 disabled:text-stone-400"
              disabled={!hasSufficientFunds}
              onClick={commitPurchase}
              type="button"
            >
              Commit this expense
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
