import { useState, type FormEvent } from 'react'
import {
  getToday,
  getNextSubscriptionBillingDate,
  isValidDate,
  type BillingFrequency,
  type Subscription,
} from '../features/finance/finance'
import { formatRupees } from '../lib/formatRupees'

type SubscriptionManagerProps = {
  subscriptions: Subscription[]
  onAdd: (subscription: Subscription) => void
  onSetActive: (id: string, active: boolean) => void
  onDelete: (id: string) => void
}

const frequencyLabels: Record<BillingFrequency, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
}

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

function formatBillingDate(value: string): string {
  return dateFormatter.format(new Date(`${value}T00:00:00.000Z`))
}

export function SubscriptionManager({
  subscriptions,
  onAdd,
  onSetActive,
  onDelete,
}: SubscriptionManagerProps) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [billingDate, setBillingDate] = useState(getToday)
  const [frequency, setFrequency] = useState<BillingFrequency>('monthly')
  const [error, setError] = useState<string | null>(null)

  function createSubscription(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedAmount = Number(amount)
    const trimmedName = name.trim()

    if (!trimmedName) {
      setError('Add a name for your subscription.')
      return
    }
    if (!Number.isSafeInteger(parsedAmount) || parsedAmount <= 0) {
      setError('Enter a subscription amount in whole rupees greater than ₹0.')
      return
    }
    if (!isValidDate(billingDate) || billingDate < getToday()) {
      setError('Choose today or a future billing date.')
      return
    }

    onAdd({
      id: crypto.randomUUID(),
      name: trimmedName,
      amount: parsedAmount,
      billingDate,
      frequency,
      active: true,
    })
    setName('')
    setAmount('')
    setBillingDate(getToday())
    setFrequency('monthly')
    setError(null)
  }

  return (
    <section
      aria-labelledby="subscriptions-heading"
      className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6"
    >
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-lime-300">
          Recurring bills
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight" id="subscriptions-heading">
          Subscriptions
        </h2>
        <p className="mt-2 text-sm leading-6 text-stone-400">
          Active upcoming bills are included in your forecast and safe-to-spend
          amount until recorded as an expense.
        </p>
        <p className="mt-2 text-xs leading-5 text-stone-500">
          When logging a bill, use the subscription name as its expense
          description so it is matched and not counted twice.
        </p>
      </div>

      <form className="grid gap-3 sm:grid-cols-2" onSubmit={createSubscription} noValidate>
        <label className="block text-sm text-stone-300" htmlFor="subscription-name">
          Subscription name
          <input
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#10130f] px-3 py-2.5 text-stone-100 placeholder:text-stone-600"
            id="subscription-name"
            maxLength={60}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Music app"
            required
            value={name}
          />
        </label>
        <label className="block text-sm text-stone-300" htmlFor="subscription-amount">
          Billing amount
          <input
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#10130f] px-3 py-2.5 text-stone-100 placeholder:text-stone-600"
            id="subscription-amount"
            inputMode="numeric"
            min="1"
            onChange={(event) => setAmount(event.target.value)}
            placeholder="e.g. 199"
            required
            step="1"
            type="number"
            value={amount}
          />
        </label>
        <label className="block text-sm text-stone-300" htmlFor="subscription-billing-date">
          Next billing date
          <input
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#10130f] px-3 py-2.5 text-stone-100 [color-scheme:dark]"
            id="subscription-billing-date"
            min={getToday()}
            onChange={(event) => setBillingDate(event.target.value)}
            required
            type="date"
            value={billingDate}
          />
        </label>
        <label className="block text-sm text-stone-300" htmlFor="subscription-frequency">
          Billing frequency
          <select
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#10130f] px-3 py-2.5 text-stone-100"
            id="subscription-frequency"
            onChange={(event) =>
              setFrequency(event.target.value as BillingFrequency)
            }
            value={frequency}
          >
            {(Object.keys(frequencyLabels) as BillingFrequency[]).map((item) => (
              <option key={item} value={item}>
                {frequencyLabels[item]}
              </option>
            ))}
          </select>
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
          Add subscription
        </button>
      </form>

      {subscriptions.length === 0 ? (
        <p className="mt-5 text-sm text-stone-500">No subscriptions added yet.</p>
      ) : (
        <ul className="mt-5 divide-y divide-white/[0.07]">
          {subscriptions.map((subscription) => (
            <li
              className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
              key={subscription.id}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-sm font-medium text-stone-100">
                    {subscription.name}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] ${
                      subscription.active
                        ? 'bg-lime-300/10 text-lime-200'
                        : 'bg-white/[0.07] text-stone-400'
                    }`}
                  >
                    {subscription.active ? 'Active' : 'Cancelled'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  {formatRupees(subscription.amount)} ·{' '}
                  {frequencyLabels[subscription.frequency]} · Next bill{' '}
                  {formatBillingDate(getNextSubscriptionBillingDate(subscription))}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  aria-label={`${subscription.active ? 'Cancel' : 'Reactivate'} ${subscription.name}`}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs text-stone-300 transition hover:bg-white/[0.06]"
                  onClick={() =>
                    onSetActive(subscription.id, !subscription.active)
                  }
                  type="button"
                >
                  {subscription.active ? 'Cancel' : 'Reactivate'}
                </button>
                <button
                  aria-label={`Delete ${subscription.name}`}
                  className="rounded-lg px-3 py-2 text-xs text-stone-500 transition hover:bg-rose-400/10 hover:text-rose-300"
                  onClick={() => onDelete(subscription.id)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
