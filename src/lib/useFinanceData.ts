import { useState } from 'react'
import {
  getToday,
  isExpense,
  isSavingsGoal,
  isSubscription,
  isValidDate,
  type Expense,
  type SavingsGoal,
  type Subscription,
} from '../features/finance/finance'

const STORAGE_KEY = 'broke-but-functional.finance.v1'
const STORAGE_ERROR = 'Your browser storage is unavailable. Changes may not be saved.'

type FinanceData = {
  startDate: string
  expenses: Expense[]
  goals: SavingsGoal[]
  subscriptions: Subscription[]
}

function loadFinanceData(): { data: FinanceData; error: string | null } {
  const fallback = { startDate: getToday(), expenses: [], goals: [], subscriptions: [] }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return { data: fallback, error: null }

    const parsed: unknown = JSON.parse(stored)
    if (typeof parsed !== 'object' || parsed === null) {
      return {
        data: fallback,
        error: 'Saved finance data could not be read. A fresh budget was started.',
      }
    }

    const savedData = parsed as Record<string, unknown>
    if (!Array.isArray(savedData.expenses)) {
      return {
        data: fallback,
        error: 'Saved finance data could not be read. A fresh budget was started.',
      }
    }
    const invalidStartDate =
      typeof savedData.startDate !== 'string' || !isValidDate(savedData.startDate)
    const hasInvalidOptionalData =
      ('goals' in savedData && !Array.isArray(savedData.goals)) ||
      ('subscriptions' in savedData && !Array.isArray(savedData.subscriptions))

    return {
      data: {
        startDate: invalidStartDate ? getToday() : savedData.startDate as string,
        expenses: savedData.expenses.filter(isExpense),
        goals: 'goals' in savedData && Array.isArray(savedData.goals)
          ? savedData.goals.filter(isSavingsGoal)
          : [],
        subscriptions:
          'subscriptions' in savedData && Array.isArray(savedData.subscriptions)
            ? savedData.subscriptions.filter(isSubscription)
            : [],
      },
      error: invalidStartDate
        ? 'The saved budget start date was invalid. A new start date was set; your saved finance data was kept.'
        : hasInvalidOptionalData
          ? 'Some saved goals or subscriptions could not be read.'
          : null,
    }
  } catch {
    return {
      data: fallback,
      error: 'Your browser storage is unavailable. Changes may not be saved.',
    }
  }
}

export function persistFinanceStartDate(): string | null {
  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY)
    if (storedValue === null) {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          startDate: getToday(),
          expenses: [],
          goals: [],
          subscriptions: [],
        }),
      )
      return null
    }

    const stored: unknown = JSON.parse(storedValue)
    if (typeof stored !== 'object' || stored === null || Array.isArray(stored)) {
      return 'Saved finance data could not be read. The existing data was left untouched.'
    }
    const data = stored as Record<string, unknown>
    if (typeof data.startDate === 'string' && isValidDate(data.startDate)) return null

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...data, startDate: getToday() }),
    )
    return 'The saved budget start date was invalid. A new start date was set; your saved finance data was kept.'
  } catch (error) {
    if (error instanceof SyntaxError) {
      return 'Saved finance data could not be read. The existing data was left untouched.'
    }
    return STORAGE_ERROR
  }
}

export function useFinanceData() {
  const [initialState] = useState(loadFinanceData)
  const [data, setData] = useState<FinanceData>(initialState.data)
  const [storageError, setStorageError] = useState<string | null>(initialState.error)

  function save(nextData: FinanceData) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData))
      setStorageError(null)
    } catch {
      setStorageError(STORAGE_ERROR)
    }
  }

  function addExpense(expense: Expense) {
    const nextData = { ...data, expenses: [expense, ...data.expenses] }
    setData(nextData)
    save(nextData)
  }

  function deleteExpense(id: string) {
    const nextData = {
      ...data,
      expenses: data.expenses.filter((expense) => expense.id !== id),
    }
    setData(nextData)
    save(nextData)
  }

  function addGoal(goal: SavingsGoal) {
    const nextData = { ...data, goals: [goal, ...data.goals] }
    setData(nextData)
    save(nextData)
  }

  function deleteGoal(id: string) {
    const nextData = { ...data, goals: data.goals.filter((goal) => goal.id !== id) }
    setData(nextData)
    save(nextData)
  }

  function addSubscription(subscription: Subscription) {
    const nextData = {
      ...data,
      subscriptions: [subscription, ...data.subscriptions],
    }
    setData(nextData)
    save(nextData)
  }

  function setSubscriptionActive(id: string, active: boolean) {
    const nextData = {
      ...data,
      subscriptions: data.subscriptions.map((subscription) =>
        subscription.id === id ? { ...subscription, active } : subscription,
      ),
    }
    setData(nextData)
    save(nextData)
  }

  function deleteSubscription(id: string) {
    const nextData = {
      ...data,
      subscriptions: data.subscriptions.filter(
        (subscription) => subscription.id !== id,
      ),
    }
    setData(nextData)
    save(nextData)
  }

  return {
    ...data,
    storageError,
    addExpense,
    deleteExpense,
    addGoal,
    deleteGoal,
    addSubscription,
    setSubscriptionActive,
    deleteSubscription,
  }
}
