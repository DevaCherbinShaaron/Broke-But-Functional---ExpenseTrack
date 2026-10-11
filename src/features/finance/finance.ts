export const MONTHLY_BUDGET = 10_000
export const BUDGET_DAYS = 30
export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Housing',
  'Shopping',
  'Bills',
  'Health',
  'Entertainment',
  'Other',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export type Expense = {
  id: string
  amount: number
  category: ExpenseCategory
  description: string
  date: string
}

export type SavingsGoal = {
  id: string
  name: string
  targetAmount: number
  savedAmount: number
}

export type BillingFrequency = 'weekly' | 'monthly' | 'yearly'

export type Subscription = {
  id: string
  name: string
  amount: number
  billingDate: string
  frequency: BillingFrequency
  active: boolean
}

export type FinancialRiskStatus =
  | 'On track'
  | 'Watch spending'
  | 'At risk'
  | 'Budget shortfall'

export type FinancialRiskAssessment = {
  status: FinancialRiskStatus
  reason: string
  action: string
  amount?: number
}

export type FinanceMetrics = {
  totalSpent: number
  remaining: number
  availableAfterCommitments: number
  safeToSpend: number
  daysRemaining: number
  daysUntilStart: number
  dayNumber: number
  forecast: number
  projectedFutureDiscretionary: number
  forecastHistoryDays: number
  subscriptionCommitments: number
  projectedRemaining: number
  health: 'On track' | 'Watch spending' | 'Over budget'
  riskAssessment: FinancialRiskAssessment
  budgetUsedPercent: number
  spendingByCategory: { category: ExpenseCategory; amount: number }[]
}

export type BudgetTimeline = {
  dayNumber: number
  daysRemaining: number
  daysUntilStart: number
  phase: 'before' | 'active' | 'ended'
}

function isPositiveWholeAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

export function isExpense(value: unknown): value is Expense {
  if (typeof value !== 'object' || value === null) return false

  const expense = value as Record<string, unknown>
  return (
    typeof expense.id === 'string' &&
    isPositiveWholeAmount(expense.amount) &&
    typeof expense.category === 'string' &&
    EXPENSE_CATEGORIES.includes(expense.category as ExpenseCategory) &&
    typeof expense.description === 'string' &&
    expense.description.trim().length > 0 &&
    typeof expense.date === 'string' &&
    isValidDate(expense.date)
  )
}

export function isSavingsGoal(value: unknown): value is SavingsGoal {
  if (typeof value !== 'object' || value === null) return false
  const goal = value as Record<string, unknown>
  return (
    typeof goal.id === 'string' &&
    typeof goal.name === 'string' &&
    goal.name.trim().length > 0 &&
    isPositiveWholeAmount(goal.targetAmount) &&
    typeof goal.savedAmount === 'number' &&
    Number.isSafeInteger(goal.savedAmount) &&
    goal.savedAmount >= 0
  )
}

export function isSubscription(value: unknown): value is Subscription {
  if (typeof value !== 'object' || value === null) return false
  const subscription = value as Record<string, unknown>
  return (
    typeof subscription.id === 'string' &&
    typeof subscription.name === 'string' &&
    subscription.name.trim().length > 0 &&
    isPositiveWholeAmount(subscription.amount) &&
    typeof subscription.billingDate === 'string' &&
    isValidDate(subscription.billingDate) &&
    ['weekly', 'monthly', 'yearly'].includes(String(subscription.frequency)) &&
    typeof subscription.active === 'boolean'
  )
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    !Number.isNaN(date.getTime()) &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

export function getToday(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function calendarDayNumber(value: string): number {
  const [year, month, day] = value.split('-').map(Number)
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000)
}

export function calculateBudgetTimeline(
  startDate: string,
  today = getToday(),
): BudgetTimeline {
  const validToday = isValidDate(today) ? today : getToday()
  const validStart = isValidDate(startDate) ? startDate : validToday
  const daysFromStart =
    calendarDayNumber(validToday) - calendarDayNumber(validStart)

  if (daysFromStart < 0) {
    return {
      dayNumber: 0,
      daysRemaining: BUDGET_DAYS,
      daysUntilStart: Math.abs(daysFromStart),
      phase: 'before',
    }
  }

  if (daysFromStart >= BUDGET_DAYS) {
    return {
      dayNumber: BUDGET_DAYS,
      daysRemaining: 0,
      daysUntilStart: 0,
      phase: 'ended',
    }
  }

  return {
    dayNumber: daysFromStart + 1,
    daysRemaining: BUDGET_DAYS - daysFromStart,
    daysUntilStart: 0,
    phase: 'active',
  }
}

function dateAtOccurrence(
  billingDate: string,
  frequency: BillingFrequency,
  occurrence: number,
): string {
  const base = new Date(`${billingDate}T00:00:00.000Z`)
  let result: Date

  if (frequency === 'weekly') {
    result = new Date(base.getTime() + occurrence * 7 * 86_400_000)
  } else if (frequency === 'monthly') {
    const monthIndex = base.getUTCMonth() + occurrence
    const year = base.getUTCFullYear() + Math.floor(monthIndex / 12)
    const month = monthIndex % 12
    const day = Math.min(
      base.getUTCDate(),
      new Date(Date.UTC(year, month + 1, 0)).getUTCDate(),
    )
    result = new Date(Date.UTC(year, month, day))
  } else {
    const year = base.getUTCFullYear() + occurrence
    const day = Math.min(
      base.getUTCDate(),
      new Date(Date.UTC(year, base.getUTCMonth() + 1, 0)).getUTCDate(),
    )
    result = new Date(Date.UTC(year, base.getUTCMonth(), day))
  }

  return result.toISOString().slice(0, 10)
}

function firstOccurrenceOnOrAfter(
  subscription: Subscription,
  date: string,
): number {
  const base = new Date(`${subscription.billingDate}T00:00:00.000Z`)
  const target = new Date(`${date}T00:00:00.000Z`)
  if (base >= target) return 0

  if (subscription.frequency === 'weekly') {
    return Math.ceil((target.getTime() - base.getTime()) / (7 * 86_400_000))
  }
  if (subscription.frequency === 'monthly') {
    return Math.max(
      0,
      (target.getUTCFullYear() - base.getUTCFullYear()) * 12 +
        target.getUTCMonth() -
        base.getUTCMonth(),
    )
  }
  return Math.max(0, target.getUTCFullYear() - base.getUTCFullYear())
}

function hasRecordedPaymentForOccurrence(
  subscription: Subscription,
  dueDate: string,
  occurrence: number,
  expenses: Expense[],
  startDate: string,
  today: string,
): boolean {
  const previousDueDate =
    occurrence > 0
      ? dateAtOccurrence(
          subscription.billingDate,
          subscription.frequency,
          occurrence - 1,
        )
      : null
  const lowerBound = previousDueDate ?? startDate

  return expenses.some(
    (expense) =>
      expense.amount === subscription.amount &&
      expense.date >= lowerBound &&
      (previousDueDate === null || expense.date > previousDueDate) &&
      expense.date <= dueDate &&
      expense.date <= today &&
      expense.description.trim().toLocaleLowerCase() ===
        subscription.name.trim().toLocaleLowerCase(),
  )
}

export function getUpcomingSubscriptionCommitments(
  subscriptions: Subscription[],
  expenses: Expense[],
  startDate: string,
  today = getToday(),
): number {
  const budgetEnd = new Date(`${startDate}T00:00:00.000Z`)
  budgetEnd.setUTCDate(budgetEnd.getUTCDate() + BUDGET_DAYS - 1)
  const lastBudgetDate = budgetEnd.toISOString().slice(0, 10)
  if (today > lastBudgetDate) return 0

  let commitments = 0
  for (const subscription of subscriptions) {
    if (!subscription.active) continue

    let occurrence = firstOccurrenceOnOrAfter(subscription, today)
    let dueDate = dateAtOccurrence(
      subscription.billingDate,
      subscription.frequency,
      occurrence,
    )
    while (dueDate < today) {
      occurrence += 1
      dueDate = dateAtOccurrence(
        subscription.billingDate,
        subscription.frequency,
        occurrence,
      )
    }

    while (dueDate <= lastBudgetDate) {
      const alreadyRecorded = hasRecordedPaymentForOccurrence(
        subscription,
        dueDate,
        occurrence,
        expenses,
        startDate,
        today,
      )
      if (!alreadyRecorded) commitments += subscription.amount
      occurrence += 1
      dueDate = dateAtOccurrence(
        subscription.billingDate,
        subscription.frequency,
        occurrence,
      )
    }

  }
  return commitments
}

function isRecordedSubscriptionExpense(
  expense: Expense,
  subscriptions: Subscription[],
  startDate: string,
  today: string,
): boolean {
  return subscriptions.some((subscription) => {
    if (
      expense.amount !== subscription.amount ||
      expense.date < startDate ||
      expense.date > today ||
      expense.description.trim().toLocaleLowerCase() !==
        subscription.name.trim().toLocaleLowerCase()
    ) {
      return false
    }

    const occurrence = firstOccurrenceOnOrAfter(subscription, expense.date)
    const dueDate = dateAtOccurrence(
      subscription.billingDate,
      subscription.frequency,
      occurrence,
    )
    return hasRecordedPaymentForOccurrence(
      subscription,
      dueDate,
      occurrence,
      [expense],
      startDate,
      expense.date,
    )
  })
}

export function getNextSubscriptionBillingDate(
  subscription: Subscription,
  today = getToday(),
): string {
  let occurrence = firstOccurrenceOnOrAfter(subscription, today)
  let date = dateAtOccurrence(
    subscription.billingDate,
    subscription.frequency,
    occurrence,
  )
  while (date < today) {
    occurrence += 1
    date = dateAtOccurrence(
      subscription.billingDate,
      subscription.frequency,
      occurrence,
    )
  }
  return date
}

export function calculateMetrics(
  expenses: Expense[],
  startDate: string,
  today = getToday(),
  subscriptions: Subscription[] = [],
): FinanceMetrics {
  const totalSpent = expenses.reduce((total, expense) => total + expense.amount, 0)
  const remaining = MONTHLY_BUDGET - totalSpent
  const timeline = calculateBudgetTimeline(startDate, today)
  const { dayNumber, daysRemaining } = timeline
  const forecastHistoryDays =
    timeline.phase === 'active' ? Math.max(0, dayNumber - 1) : 0
  const subscriptionCommitments = getUpcomingSubscriptionCommitments(
    subscriptions,
    expenses,
    startDate,
    timeline.phase === 'before' ? startDate : today,
  )
  const dailyDiscretionarySpend = new Map<string, number>()
  for (const expense of expenses) {
    if (
      expense.date < startDate ||
      expense.date >= today ||
      expense.description.trim().toLocaleLowerCase().startsWith('unexpected:')
    ) {
      continue
    }

    if (isRecordedSubscriptionExpense(expense, subscriptions, startDate, today)) {
      continue
    }

    dailyDiscretionarySpend.set(
      expense.date,
      (dailyDiscretionarySpend.get(expense.date) ?? 0) + expense.amount,
    )
  }

  const projectedFutureDiscretionary =
    timeline.phase === 'active' &&
    forecastHistoryDays >= 7 &&
    daysRemaining > 0
      ? Math.floor(
          median(
            Array.from({ length: forecastHistoryDays }, (_, index) => {
              const date = addCalendarDays(startDate, index)
              return dailyDiscretionarySpend.get(date) ?? 0
            }),
          ) * daysRemaining,
        )
      : 0
  const availableAfterCommitments = remaining - subscriptionCommitments
  const forecast =
    totalSpent + projectedFutureDiscretionary + subscriptionCommitments
  const projectedRemaining = MONTHLY_BUDGET - forecast
  const budgetUsedPercent = (totalSpent / MONTHLY_BUDGET) * 100

  let health: FinanceMetrics['health'] = 'On track'
  if (remaining < 0) health = 'Over budget'
  else if (daysRemaining === 0 || projectedRemaining < 0) {
    health = 'Watch spending'
  }

  function addCalendarDays(value: string, days: number): string {
    const [year, month, day] = value.split('-').map(Number)
    const date = new Date(Date.UTC(year, month - 1, day + days))
    return [
      date.getUTCFullYear(),
      String(date.getUTCMonth() + 1).padStart(2, '0'),
      String(date.getUTCDate()).padStart(2, '0'),
    ].join('-')
  }

  const categoryTotals = new Map<ExpenseCategory, number>()
  for (const expense of expenses) {
    categoryTotals.set(
      expense.category,
      (categoryTotals.get(expense.category) ?? 0) + expense.amount,
    )
  }

  const spendingByCategory = EXPENSE_CATEGORIES
    .map((category) => ({ category, amount: categoryTotals.get(category) ?? 0 }))
    .filter(({ amount }) => amount > 0)
    .sort((left, right) => right.amount - left.amount)

  const riskMetrics = {
    remaining,
    availableAfterCommitments,
    safeToSpend:
      daysRemaining > 0
        ? Math.floor(
            Math.max(0, remaining - subscriptionCommitments) / daysRemaining,
          )
        : 0,
    daysRemaining,
    forecast,
    subscriptionCommitments,
    projectedRemaining,
  }

  return {
    totalSpent,
    remaining,
    availableAfterCommitments,
    safeToSpend: riskMetrics.safeToSpend,
    daysRemaining,
    daysUntilStart: timeline.daysUntilStart,
    dayNumber,
    forecast,
    projectedFutureDiscretionary,
    forecastHistoryDays,
    subscriptionCommitments,
    projectedRemaining,
    health,
    riskAssessment: assessFinancialRisk(riskMetrics),
    budgetUsedPercent: Math.max(0, budgetUsedPercent),
    spendingByCategory,
  }
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle]
}

export function assessFinancialRisk(
  metrics: Pick<
    FinanceMetrics,
    | 'remaining'
    | 'availableAfterCommitments'
    | 'safeToSpend'
    | 'daysRemaining'
    | 'forecast'
    | 'subscriptionCommitments'
    | 'projectedRemaining'
  >,
): FinancialRiskAssessment {
  if (metrics.remaining < 0) {
    return {
      status: 'Budget shortfall',
      reason: 'Recorded expenses are already above the starting budget.',
      action: 'Review essential costs and avoid new non-essential spending where possible.',
      amount: Math.abs(metrics.remaining),
    }
  }
  if (metrics.projectedRemaining < 0) {
    return {
      status: 'Budget shortfall',
      reason: 'Your spending pace and upcoming bills are projected to exceed the budget.',
      action: 'Reduce flexible spending and review upcoming subscription bills.',
      amount: Math.abs(metrics.projectedRemaining),
    }
  }

  const startingDailyPace = Math.floor(MONTHLY_BUDGET / BUDGET_DAYS)

  if (metrics.daysRemaining === 0) {
    return {
      status: 'Watch spending',
      reason: 'The 30-day budget period has ended, so this allowance no longer represents a full month.',
      action: 'Review this month’s totals before starting your next budget period.',
    }
  }

  if (metrics.availableAfterCommitments < startingDailyPace) {
    return {
      status: 'At risk',
      reason:
        'After reserving active subscription bills, less than one day of your original budget pace remains available.',
      action: 'Protect the remaining balance for essentials and consider cancelling unused subscriptions.',
      amount: Math.max(0, metrics.availableAfterCommitments),
    }
  }

  if (metrics.safeToSpend < startingDailyPace) {
    return {
      status: 'Watch spending',
      reason:
        'Your safe daily amount is below the original daily budget pace after accounting for remaining days and bills.',
      action: 'Keep discretionary spending below today’s safe-to-spend amount.',
      amount: metrics.safeToSpend,
    }
  }

  return {
    status: 'On track',
    reason:
      'Your remaining balance covers upcoming subscription commitments, and your daily allowance is at least the original budget pace.',
    action: 'Keep logging expenses and check again when a bill or unexpected cost comes up.',
  }
}
