import { formatRupees } from '../lib/formatRupees'
import type { Expense } from '../features/finance/finance'

type TransactionListProps = {
  expenses: Expense[]
  onDelete: (id: string) => void
}

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
})

function formatDate(date: string): string {
  return dateFormatter.format(new Date(`${date}T12:00:00`))
}

export function TransactionList({ expenses, onDelete }: TransactionListProps) {
  return (
    <section
      aria-labelledby="transactions-heading"
      className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6"
    >
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-lime-300">
            Your activity
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight" id="transactions-heading">
            Recent expenses
          </h2>
        </div>
        <span className="text-xs text-stone-500">
          {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}
        </span>
      </div>
      {expenses.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-stone-500">
          No expenses yet. Add your first one to see your month take shape.
        </p>
      ) : (
        <ul className="divide-y divide-white/[0.07]">
          {expenses.map((expense) => (
            <li
              className="flex items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
              key={expense.id}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-stone-100">
                  {expense.description}
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  {expense.category} <span aria-hidden="true">·</span> {formatDate(expense.date)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-medium tabular-nums text-stone-200">
                  −{formatRupees(expense.amount)}
                </span>
                <button
                  aria-label={`Delete ${expense.description}`}
                  className="grid size-9 place-items-center rounded-xl text-stone-500 transition hover:bg-rose-400/10 hover:text-rose-300"
                  onClick={() => onDelete(expense.id)}
                  type="button"
                >
                  <svg aria-hidden="true" fill="none" height="17" viewBox="0 0 24 24" width="17">
                    <path
                      d="M4 7h16M10 11v6m4-6v6M5 7l1 13h12l1-13M9 7V4h6v3"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.6"
                    />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
