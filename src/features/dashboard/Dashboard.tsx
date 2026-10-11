import { useMemo } from 'react'
import { ExpenseForm } from '../../components/ExpenseForm'
import { FinancialRiskCard } from '../../components/FinancialRiskCard'
import { MetricCard } from '../../components/MetricCard'
import { MonthlyForecast } from '../../components/MonthlyForecast'
import { MoneyDecisionSimulator } from '../../components/MoneyDecisionSimulator'
import { SavingsGoals } from '../../components/SavingsGoals'
import { SpendingBreakdown } from '../../components/SpendingBreakdown'
import { SubscriptionManager } from '../../components/SubscriptionManager'
import { TransactionList } from '../../components/TransactionList'
import { UnexpectedExpenseSimulator } from '../../components/UnexpectedExpenseSimulator'
import { useFinanceData } from '../../lib/useFinanceData'
import { formatRupees } from '../../lib/formatRupees'
import {
  BUDGET_DAYS,
  calculateMetrics,
  MONTHLY_BUDGET,
} from '../finance/finance'

type DashboardProps = {
  onBack: () => void
  startupStorageError: string | null
}

export function Dashboard({ onBack, startupStorageError }: DashboardProps) {
  const {
    expenses,
    goals,
    startDate,
    storageError,
    subscriptions,
    addExpense,
    deleteExpense,
    addGoal,
    deleteGoal,
    addSubscription,
    setSubscriptionActive,
    deleteSubscription,
  } = useFinanceData()
  const metrics = useMemo(
    () => calculateMetrics(expenses, startDate, undefined, subscriptions),
    [expenses, startDate, subscriptions],
  )
  const budgetStartDate = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${startDate}T00:00:00.000Z`))

  return (
    <main className="min-h-screen bg-[#10130f] px-4 py-6 text-stone-100 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm font-semibold tracking-wide">
            <span
              aria-hidden="true"
              className="grid size-10 place-items-center rounded-2xl bg-lime-300 text-lg font-black text-[#10130f]"
            >
              ₹
            </span>
            BROKE BUT FUNCTIONAL
          </div>
          <button
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-stone-300 transition hover:bg-white/[0.06] hover:text-white"
            onClick={onBack}
            type="button"
          >
            Back to home
          </button>
        </header>

        <section
          aria-labelledby="dashboard-heading"
          className="mb-7 mt-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-lime-300">
              Your month at a glance
            </p>
            <h1
              className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl"
              id="dashboard-heading"
            >
              You have got this.
            </h1>
            <p className="mt-3 text-sm text-stone-400">
              {metrics.dayNumber === 0 ? (
                <>
                  Starts in {metrics.daysUntilStart}{' '}
                  {metrics.daysUntilStart === 1 ? 'day' : 'days'}{' '}
                  <span aria-hidden="true">·</span> Start date {budgetStartDate}
                </>
              ) : metrics.daysRemaining === 0 ? (
                <>
                  Day {BUDGET_DAYS} of {BUDGET_DAYS}{' '}
                  <span aria-hidden="true">·</span> 30-day budget ended{' '}
                  <span aria-hidden="true">·</span> Started {budgetStartDate}
                </>
              ) : (
                <>
                  Day {metrics.dayNumber} of {BUDGET_DAYS}{' '}
                  <span aria-hidden="true">·</span> {metrics.daysRemaining}{' '}
                  {metrics.daysRemaining === 1 ? 'day' : 'days'} left{' '}
                  <span aria-hidden="true">·</span> Started {budgetStartDate}
                </>
              )}
            </p>
          </div>
          <span className="rounded-full border border-white/10 px-3.5 py-2 text-sm text-stone-400">
            {metrics.riskAssessment.status}
          </span>
        </section>

        {(storageError ?? startupStorageError) && (
          <p
            className="mb-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100"
            role="alert"
          >
            {storageError ?? startupStorageError}
          </p>
        )}

        <section
          aria-label="Budget summary"
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          <MetricCard
            detail={`${BUDGET_DAYS}-day starting budget`}
            label="Total budget"
            value={formatRupees(MONTHLY_BUDGET)}
          />
          <MetricCard
            detail={`${Math.round(metrics.budgetUsedPercent)}% of your budget`}
            label="Total spent"
            value={formatRupees(metrics.totalSpent)}
          />
          <MetricCard
            accent
            detail={metrics.remaining < 0 ? 'Over your starting budget' : 'Still yours to use'}
            label="Remaining balance"
            value={formatRupees(metrics.remaining)}
          />
          <MetricCard
            accent
            detail={
              metrics.daysRemaining > 0
                ? `Per day for the next ${metrics.daysRemaining} days`
                : 'Your 30-day budget has ended'
            }
            label="Safe to spend today"
            value={formatRupees(metrics.safeToSpend)}
          />
        </section>

        <div className="mb-5">
          <FinancialRiskCard assessment={metrics.riskAssessment} />
        </div>

        <div className="mt-5">
          <MoneyDecisionSimulator
            actualExpenses={expenses}
            actualMetrics={metrics}
            onCommit={addExpense}
            startDate={startDate}
            subscriptions={subscriptions}
          />
        </div>

        <div className="mt-5">
          <UnexpectedExpenseSimulator
            actualExpenses={expenses}
            actualMetrics={metrics}
            goals={goals}
            onConfirm={addExpense}
            startDate={startDate}
            subscriptions={subscriptions}
          />
        </div>

        <div className="mt-5 grid items-start gap-5 lg:grid-cols-2">
          <SavingsGoals
            goals={goals}
            metrics={metrics}
            onAdd={addGoal}
            onDelete={deleteGoal}
          />
          <SubscriptionManager
            onAdd={addSubscription}
            onDelete={deleteSubscription}
            onSetActive={setSubscriptionActive}
            subscriptions={subscriptions}
          />
        </div>

        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="grid gap-5">
            <ExpenseForm onAdd={addExpense} />
            <TransactionList expenses={expenses} onDelete={deleteExpense} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            <SpendingBreakdown
              spendingByCategory={metrics.spendingByCategory}
              totalSpent={metrics.totalSpent}
            />
            <MonthlyForecast metrics={metrics} />
          </div>
        </div>

        <footer className="mt-8 border-t border-white/10 py-5 text-center text-xs text-stone-500">
          Small steps. Fewer money surprises.
        </footer>
      </div>
    </main>
  )
}
