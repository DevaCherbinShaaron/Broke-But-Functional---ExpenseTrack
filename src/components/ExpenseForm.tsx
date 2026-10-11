import { useState, type FormEvent } from 'react'
import {
  EXPENSE_CATEGORIES,
  getToday,
  isValidDate,
  type Expense,
  type ExpenseCategory,
} from '../features/finance/finance'

type ExpenseFormProps = {
  onAdd: (expense: Expense) => void
}

export function ExpenseForm({ onAdd }: ExpenseFormProps) {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('Food')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(getToday)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedAmount = Number(amount)

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Enter an amount greater than ₹0.')
      return
    }
    if (!Number.isInteger(parsedAmount)) {
      setError('Enter the amount in whole rupees.')
      return
    }
    if (!description.trim()) {
      setError('Add a short description for this expense.')
      return
    }
    if (!isValidDate(date) || date > getToday()) {
      setError('Choose a valid expense date.')
      return
    }

    onAdd({
      id: crypto.randomUUID(),
      amount: parsedAmount,
      category,
      description: description.trim(),
      date,
    })
    setAmount('')
    setDescription('')
    setError(null)
  }

  return (
    <section
      aria-labelledby="add-expense-heading"
      className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6"
    >
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-lime-300">
          Keep it current
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight" id="add-expense-heading">
          Add an expense
        </h2>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-stone-300" htmlFor="expense-amount">
            Expense amount
            <span className="relative mt-2 block">
              <span aria-hidden="true" className="absolute left-3 top-2.5 text-stone-500">
                ₹
              </span>
              <input
                autoComplete="off"
                className="w-full rounded-xl border border-white/10 bg-[#10130f] py-2.5 pl-8 pr-3 text-stone-100 placeholder:text-stone-600"
                id="expense-amount"
                inputMode="numeric"
                min="1"
                name="amount"
                onChange={(event) => setAmount(event.target.value)}
                placeholder="e.g. 250"
                required
                step="1"
                type="number"
                value={amount}
              />
            </span>
          </label>
          <label className="block text-sm text-stone-300" htmlFor="expense-category">
            Category
            <select
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#10130f] px-3 py-2.5 text-stone-100"
              id="expense-category"
              name="category"
              onChange={(event) => setCategory(event.target.value as ExpenseCategory)}
              value={category}
            >
              {EXPENSE_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block text-sm text-stone-300" htmlFor="expense-description">
          Description
          <input
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#10130f] px-3 py-2.5 text-stone-100 placeholder:text-stone-600"
            id="expense-description"
            maxLength={80}
            name="description"
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What was it for?"
            required
            value={description}
          />
        </label>
        <label className="block text-sm text-stone-300" htmlFor="expense-date">
          Date
          <input
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#10130f] px-3 py-2.5 text-stone-100 [color-scheme:dark]"
            id="expense-date"
            max={getToday()}
            name="date"
            onChange={(event) => setDate(event.target.value)}
            required
            type="date"
            value={date}
          />
        </label>
        {error && (
          <p className="text-sm text-rose-300" role="alert">
            {error}
          </p>
        )}
        <button
          className="w-full rounded-xl bg-lime-300 px-4 py-3 text-sm font-semibold text-[#10130f] transition hover:bg-lime-200"
          type="submit"
        >
          Add expense
        </button>
      </form>
    </section>
  )
}
