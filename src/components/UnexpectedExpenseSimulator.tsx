import { useRef, useState, type FormEvent } from 'react'
import {
  calculateMetrics,
  getToday,
  type Expense,
  type SavingsGoal,
  type Subscription,
} from '../features/finance/finance'
import { formatRupees } from '../lib/formatRupees'
import { FinancialRiskCard } from './FinancialRiskCard'
import { MetricCard } from './MetricCard'

type UnexpectedExpenseSimulatorProps = {
  actualExpenses: Expense[]
  actualMetrics: ReturnType<typeof calculateMetrics>
  goals: SavingsGoal[]
  subscriptions: Subscription[]
  startDate: string
  onConfirm: (expense: Expense) => void
}

type UnexpectedProposal = {
  amount: number
  description: string
}

const scenarios = [
  { description: 'Medical bill', amount: 2_000 },
  { description: 'Emergency travel', amount: 1_500 },
  { description: 'Device repair', amount: 3_000 },
]

export function UnexpectedExpenseSimulator({
  actualExpenses,
  actualMetrics,
  goals,
  subscriptions,
  startDate,
  onConfirm,
}: UnexpectedExpenseSimulatorProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [proposal, setProposal] = useState<UnexpectedProposal | null>(null)
  const [error, setError] = useState<string | null>(null)
  const confirmationHandled = useRef(false)

  const simulatedMetrics = proposal
    ? calculateMetrics(
        [
          ...actualExpenses,
          {
            id: 'uncommitted-unexpected-expense',
            amount: proposal.amount,
            category: 'Other',
            description: `Unexpected: ${proposal.description}`,
            date: getToday(),
          },
        ],
        startDate,
        undefined,
        subscriptions,
      )
    : null

  function previewExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedAmount = Number(amount)
    const trimmedDescription = description.trim()

    if (!Number.isSafeInteger(parsedAmount) || parsedAmount <= 0) {
      setError('Enter a whole-rupee amount greater than ₹0.')
      setProposal(null)
      return
    }
    if (!trimmedDescription) {
      setError('Add a short description for this unexpected expense.')
      setProposal(null)
      return
    }

    confirmationHandled.current = false
    setError(null)
    setProposal({ amount: parsedAmount, description: trimmedDescription })
  }

  function cancelPreview() {
    confirmationHandled.current = true
    setProposal(null)
    setAmount('')
    setDescription('')
    setError(null)
  }

  function confirmExpense() {
    if (!proposal || confirmationHandled.current) return
    confirmationHandled.current = true
    onConfirm({
      id: crypto.randomUUID(),
      amount: proposal.amount,
      category: 'Other',
      description: `Unexpected: ${proposal.description}`,
      date: getToday(),
    })
    setProposal(null)
    setAmount('')
    setDescription('')
    setError(null)
  }

  return (
    <section
      aria-labelledby="unexpected-expense-heading"
      className="rounded-3xl border border-amber-300/15 bg-amber-300/[0.035] p-5 sm:p-6"
    >
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-200">
          Plans change
        </p>
        <h2
          className="mt-2 text-xl font-semibold tracking-tight"
          id="unexpected-expense-heading"
        >
          Life happens
        </h2>
        <p className="mt-2 text-sm leading-6 text-stone-400">
          See what an unexpected cost could mean before adding it to your actual
          expenses.
        </p>
      </div>

      <div aria-label="Suggested scenarios" className="mb-4 flex flex-wrap gap-2">
        {scenarios.map((scenario) => (
          <button
            className="rounded-full border border-white/10 px-3 py-2 text-xs text-stone-300 transition hover:bg-white/[0.06] hover:text-white"
            key={scenario.description}
            onClick={() => {
              confirmationHandled.current = true
              setProposal(null)
              setAmount(String(scenario.amount))
              setDescription(scenario.description)
              setError(null)
            }}
            type="button"
          >
            {scenario.description} · {formatRupees(scenario.amount)}
          </button>
        ))}
      </div>

      <form
        className="grid gap-4 sm:grid-cols-[0.7fr_1fr_auto]"
        noValidate
        onSubmit={previewExpense}
      >
        <label className="block text-sm text-stone-300" htmlFor="unexpected-amount">
          Unexpected amount
          <span className="relative mt-2 block">
            <span aria-hidden="true" className="absolute left-3 top-2.5 text-stone-500">
              ₹
            </span>
            <input
              aria-describedby={error ? 'unexpected-error' : undefined}
              className="w-full rounded-xl border border-white/10 bg-[#10130f] py-2.5 pl-8 pr-3 text-stone-100 placeholder:text-stone-600"
              id="unexpected-amount"
              inputMode="numeric"
              min="1"
              onChange={(event) => {
                confirmationHandled.current = true
                setProposal(null)
                setAmount(event.target.value)
              }}
              placeholder="e.g. 2,000"
              required
              step="1"
              type="number"
              value={amount}
            />
          </span>
        </label>
        <label className="block text-sm text-stone-300" htmlFor="unexpected-description">
          What happened?
          <input
            aria-describedby={error ? 'unexpected-error' : undefined}
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#10130f] px-3 py-2.5 text-stone-100 placeholder:text-stone-600"
            id="unexpected-description"
            maxLength={80}
            onChange={(event) => {
              confirmationHandled.current = true
              setProposal(null)
              setDescription(event.target.value)
            }}
            placeholder="Describe the unexpected cost"
            required
            value={description}
          />
        </label>
        <button
          className="self-end rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-stone-200 transition hover:bg-white/[0.06]"
          type="submit"
        >
          Preview impact
        </button>
      </form>

      {error && (
        <p className="mt-3 text-sm text-rose-300" id="unexpected-error" role="alert">
          {error}
        </p>
      )}

      {proposal && simulatedMetrics && (
        <div
          aria-label="Unexpected expense simulation"
          className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-[#10130f]/70 p-4 sm:p-5"
          role="region"
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-amber-200">
              Preview only · actual balance and saved expenses are unchanged
            </p>
            <p className="mt-2 text-sm font-medium text-stone-100">
              {proposal.description} · {formatRupees(proposal.amount)}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              accent
              detail={`Actual: ${formatRupees(actualMetrics.remaining)}`}
              label="Preview remaining balance"
              value={formatRupees(simulatedMetrics.remaining)}
            />
            <MetricCard
              accent
              detail={`Actual daily allowance: ${formatRupees(actualMetrics.safeToSpend)}`}
              label="Preview safe daily spend"
              value={formatRupees(simulatedMetrics.safeToSpend)}
            />
            <MetricCard
              detail="No subscription is added or removed by this expense"
              label="Upcoming subscriptions"
              value={formatRupees(simulatedMetrics.subscriptionCommitments)}
            />
            <MetricCard
              detail={`Actual forecast: ${formatRupees(actualMetrics.forecast)}`}
              label="Preview month-end forecast"
              value={formatRupees(simulatedMetrics.forecast)}
            />
          </div>

          <div className="rounded-2xl border border-white/10 p-4">
            <h3 className="text-sm font-semibold text-stone-100">
              Savings-goal affordability in preview
            </h3>
            {goals.length === 0 ? (
              <p className="mt-2 text-sm text-stone-500">
                No goals to compare. Your actual goals remain unchanged.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {goals.map((goal) => {
                  const remainingToGoal = Math.max(
                    0,
                    goal.targetAmount - goal.savedAmount,
                  )
                  const affordable =
                    remainingToGoal <= Math.max(0, simulatedMetrics.projectedRemaining)
                  return (
                    <li
                      className="flex flex-wrap justify-between gap-2 text-sm"
                      key={goal.id}
                    >
                      <span className="text-stone-300">{goal.name}</span>
                      <span className={affordable ? 'text-lime-200' : 'text-amber-200'}>
                        {affordable
                          ? 'Still affordable'
                          : `Would need ${formatRupees(remainingToGoal)}; projected funds ${formatRupees(Math.max(0, simulatedMetrics.projectedRemaining))}`}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <FinancialRiskCard
            assessment={simulatedMetrics.riskAssessment}
            simulated
          />

          {simulatedMetrics.remaining < 0 && (
            <p className="text-sm leading-6 text-rose-200" role="alert">
              This expense exceeds your current remaining balance by{' '}
              {formatRupees(Math.abs(simulatedMetrics.remaining))}. You can still
              confirm it to record a real emergency cost; the shortfall will be
              reflected in your dashboard.
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-stone-300 transition hover:bg-white/[0.06]"
              onClick={cancelPreview}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-xl bg-amber-200 px-4 py-2.5 text-sm font-semibold text-[#10130f] transition hover:bg-amber-100"
              onClick={confirmExpense}
              type="button"
            >
              Confirm unexpected expense
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
