import { useState, type FormEvent } from 'react'
import type { FinanceMetrics, SavingsGoal } from '../features/finance/finance'
import { formatRupees } from '../lib/formatRupees'

type SavingsGoalsProps = {
  goals: SavingsGoal[]
  metrics: FinanceMetrics
  onAdd: (goal: SavingsGoal) => void
  onDelete: (id: string) => void
}

export function SavingsGoals({ goals, metrics, onAdd, onDelete }: SavingsGoalsProps) {
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [savedAmount, setSavedAmount] = useState('')
  const [error, setError] = useState<string | null>(null)

  function createGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const target = Number(targetAmount)
    const saved = savedAmount.trim() === '' ? 0 : Number(savedAmount)
    const trimmedName = name.trim()

    if (!trimmedName) {
      setError('Add a name for your goal.')
      return
    }
    if (!Number.isSafeInteger(target) || target <= 0) {
      setError('Enter a target amount in whole rupees greater than ₹0.')
      return
    }
    if (!Number.isSafeInteger(saved) || saved < 0) {
      setError('Enter saved so far as a non-negative whole-rupee amount.')
      return
    }

    onAdd({
      id: crypto.randomUUID(),
      name: trimmedName,
      targetAmount: target,
      savedAmount: saved,
    })
    setName('')
    setTargetAmount('')
    setSavedAmount('')
    setError(null)
  }

  return (
    <section
      aria-labelledby="savings-goals-heading"
      className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6"
    >
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-lime-300">
          Future you says thanks
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight" id="savings-goals-heading">
          Savings goals
        </h2>
      </div>

      <form className="grid gap-3 sm:grid-cols-2" onSubmit={createGoal} noValidate>
        <label className="block text-sm text-stone-300" htmlFor="goal-name">
          Goal name
          <input
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#10130f] px-3 py-2.5 text-stone-100 placeholder:text-stone-600"
            id="goal-name"
            maxLength={60}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Emergency fund"
            required
            value={name}
          />
        </label>
        <label className="block text-sm text-stone-300" htmlFor="goal-target">
          Target amount
          <input
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#10130f] px-3 py-2.5 text-stone-100 placeholder:text-stone-600"
            id="goal-target"
            inputMode="numeric"
            min="1"
            onChange={(event) => setTargetAmount(event.target.value)}
            placeholder="e.g. 5,000"
            required
            step="1"
            type="number"
            value={targetAmount}
          />
        </label>
        <label className="block text-sm text-stone-300 sm:col-span-2">
          Already saved <span className="text-stone-500">(optional)</span>
          <input
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#10130f] px-3 py-2.5 text-stone-100 placeholder:text-stone-600"
            id="goal-saved"
            inputMode="numeric"
            min="0"
            onChange={(event) => setSavedAmount(event.target.value)}
            placeholder="0"
            step="1"
            type="number"
            value={savedAmount}
          />
        </label>
        {error && (
          <p className="text-sm text-rose-300 sm:col-span-2" role="alert">
            {error}
          </p>
        )}
        <button
          className="rounded-xl bg-lime-300 px-4 py-2.5 text-sm font-semibold text-[#10130f] transition hover:bg-lime-200 sm:col-span-2"
          type="submit"
        >
          Create savings goal
        </button>
      </form>

      <p className="mt-4 text-xs leading-5 text-stone-500">
        Goals are tracked separately, not deducted as expenses. Achievability is
        estimated from your projected budget after active subscriptions.
      </p>

      {goals.length === 0 ? (
        <p className="mt-5 text-sm text-stone-500">Your goals will appear here.</p>
      ) : (
        <ul className="mt-5 divide-y divide-white/[0.07]">
          {goals.map((goal) => {
            const remaining = Math.max(0, goal.targetAmount - goal.savedAmount)
            const progress = Math.min(100, (goal.savedAmount / goal.targetAmount) * 100)
            const achievable = remaining <= Math.max(0, metrics.projectedRemaining)
            return (
              <li className="py-4 first:pt-0 last:pb-0" key={goal.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-medium text-stone-100">
                      {goal.name}
                    </h3>
                    <p className="mt-1 text-xs text-stone-500">
                      {formatRupees(goal.savedAmount)} saved of{' '}
                      {formatRupees(goal.targetAmount)}
                    </p>
                  </div>
                  <button
                    aria-label={`Delete ${goal.name} goal`}
                    className="rounded-lg px-2 py-1 text-xs text-stone-500 transition hover:bg-rose-400/10 hover:text-rose-300"
                    onClick={() => onDelete(goal.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
                <div
                  aria-label={`${goal.name} progress: ${Math.round(progress)}%`}
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={Math.round(progress)}
                  className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"
                  role="progressbar"
                >
                  <div
                    className="h-full rounded-full bg-lime-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs">
                  <span className="text-stone-500">
                    {remaining > 0 ? `${formatRupees(remaining)} to go` : 'Goal reached'}
                  </span>
                  <span className={achievable ? 'text-lime-200' : 'text-amber-200'}>
                    {achievable ? 'Achievable in this budget' : 'Beyond this budget'}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
