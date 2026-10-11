import { describe, expect, it } from 'vitest'
import {
  calculateBudgetTimeline,
  calculateMetrics,
  getNextSubscriptionBillingDate,
  getUpcomingSubscriptionCommitments,
  isExpense,
  isSavingsGoal,
  isSubscription,
  isValidDate,
  type Expense,
  type Subscription,
} from './finance'

const expenses: Expense[] = [
  {
    id: 'lunch',
    amount: 500,
    category: 'Food',
    description: 'Lunch',
    date: '2026-10-11',
  },
  {
    id: 'bus',
    amount: 100,
    category: 'Transport',
    description: 'Bus pass',
    date: '2026-10-11',
  },
]

const monthlySubscription: Subscription = {
  id: 'music',
  name: 'Music app',
  amount: 500,
  billingDate: '2026-10-11',
  frequency: 'monthly',
  active: true,
}

describe('finance calculations', () => {
  it('recalculates remaining balance, daily allowance, category totals, and forecast', () => {
    const metrics = calculateMetrics(expenses, '2026-10-11', '2026-10-16')

    expect(metrics.totalSpent).toBe(600)
    expect(metrics.remaining).toBe(9_400)
    expect(metrics.safeToSpend).toBe(9_400 / 25)
    expect(metrics.projectedFutureDiscretionary).toBe(0)
    expect(metrics.forecast).toBe(600)
    expect(metrics.spendingByCategory).toEqual([
      { category: 'Food', amount: 500 },
      { category: 'Transport', amount: 100 },
    ])
  })

  it('flags an over-budget month and never gives a negative daily allowance', () => {
    const metrics = calculateMetrics(
      [{ ...expenses[0], amount: 10_500 }],
      '2026-10-11',
    )

    expect(metrics.health).toBe('Over budget')
    expect(metrics.remaining).toBe(-500)
    expect(metrics.safeToSpend).toBe(0)
  })

  it('counts the current day in the allowance and expires after day 30', () => {
    const firstDay = calculateMetrics([], '2026-10-11', '2026-10-11')
    const lastDay = calculateMetrics([], '2026-10-11', '2026-11-09')
    const expired = calculateMetrics([], '2026-10-11', '2026-11-10')

    expect(firstDay).toMatchObject({ dayNumber: 1, daysRemaining: 30, safeToSpend: 333 })
    expect(lastDay).toMatchObject({ dayNumber: 30, daysRemaining: 1, safeToSpend: 10_000 })
    expect(expired).toMatchObject({ dayNumber: 30, daysRemaining: 0, safeToSpend: 0 })
  })

  it('counts budget days from local calendar dates including start day and day 30', () => {
    expect(calculateBudgetTimeline('2026-10-11', '2026-10-11')).toMatchObject({
      dayNumber: 1,
      daysRemaining: 30,
      phase: 'active',
    })
    expect(calculateBudgetTimeline('2026-10-11', '2026-10-12')).toMatchObject({
      dayNumber: 2,
      daysRemaining: 29,
      phase: 'active',
    })
    expect(calculateBudgetTimeline('2026-10-11', '2026-11-09')).toMatchObject({
      dayNumber: 30,
      daysRemaining: 1,
      phase: 'active',
    })
  })

  it('handles dates before and after a budget period without extending its day count', () => {
    expect(calculateBudgetTimeline('2026-10-11', '2026-10-10')).toMatchObject({
      dayNumber: 0,
      daysRemaining: 30,
      daysUntilStart: 1,
      phase: 'before',
    })
    expect(calculateBudgetTimeline('2026-10-11', '2026-11-10')).toMatchObject({
      dayNumber: 30,
      daysRemaining: 0,
      phase: 'ended',
    })
  })

  it('falls back safely for invalid start or current dates', () => {
    const fallback = calculateBudgetTimeline('2026-02-30', '2026-10-11')
    expect(fallback).toMatchObject({
      dayNumber: 1,
      daysRemaining: 30,
      phase: 'active',
    })
    expect(
      calculateBudgetTimeline('2026-10-11', 'not-a-date').phase,
    ).toBe('active')
  })

  it('uses calendar days across daylight-saving transitions without 24-hour arithmetic', () => {
    expect(calculateBudgetTimeline('2026-03-07', '2026-03-08')).toMatchObject({
      dayNumber: 2,
      daysRemaining: 29,
    })
    expect(calculateBudgetTimeline('2026-11-01', '2026-11-02')).toMatchObject({
      dayNumber: 2,
      daysRemaining: 29,
    })
  })

  it('rounds a fractional daily allowance down instead of overstating it', () => {
    const metrics = calculateMetrics(
      [{ ...expenses[0], amount: 9_999 }],
      '2026-10-11',
      '2026-11-08',
    )

    expect(metrics.safeToSpend).toBe(0)
  })

  it('rejects non-positive expenses and impossible dates', () => {
    expect(isExpense({ ...expenses[0], amount: 0 })).toBe(false)
    expect(isExpense({ ...expenses[0], amount: -1 })).toBe(false)
    expect(isValidDate('2026-02-30')).toBe(false)
    expect(isValidDate('2026-02-28')).toBe(true)
  })

  it('includes active subscription bills in forecast and daily available money', () => {
    const metrics = calculateMetrics(
      [],
      '2026-10-11',
      '2026-10-11',
      [monthlySubscription],
    )

    expect(metrics.subscriptionCommitments).toBe(500)
    expect(metrics.forecast).toBe(500)
    expect(metrics.projectedRemaining).toBe(9_500)
    expect(metrics.safeToSpend).toBe(316)
  })

  it('forecasts zero when there is no actual or committed spending', () => {
    const metrics = calculateMetrics([], '2026-10-11', '2026-10-11')

    expect(metrics).toMatchObject({
      totalSpent: 0,
      subscriptionCommitments: 0,
      projectedFutureDiscretionary: 0,
      forecast: 0,
      projectedRemaining: 10_000,
      safeToSpend: 333,
    })
  })

  it('keeps a one-time day-one medical expense as actual spending, not a monthly run rate', () => {
    const medicalExpense: Expense = {
      id: 'medical',
      amount: 2_000,
      category: 'Health',
      description: 'Medical bill',
      date: '2026-10-11',
    }
    const metrics = calculateMetrics(
      [medicalExpense],
      '2026-10-11',
      '2026-10-11',
    )

    expect(metrics.totalSpent).toBe(2_000)
    expect(metrics.projectedFutureDiscretionary).toBe(0)
    expect(metrics.forecast).toBe(2_000)
    expect(metrics.projectedRemaining).toBe(8_000)
  })

  it('adds an active upcoming monthly subscription without multiplying actual spending', () => {
    const metrics = calculateMetrics(
      [{
        id: 'medical',
        amount: 2_000,
        category: 'Health',
        description: 'Medical bill',
        date: '2026-10-11',
      }],
      '2026-10-11',
      '2026-10-11',
      [{
        ...monthlySubscription,
        amount: 199,
        billingDate: '2026-10-15',
      }],
    )

    expect(metrics.totalSpent).toBe(2_000)
    expect(metrics.subscriptionCommitments).toBe(199)
    expect(metrics.projectedFutureDiscretionary).toBe(0)
    expect(metrics.forecast).toBe(2_199)
    expect(metrics.projectedRemaining).toBe(7_801)
  })

  it('projects future discretionary spending only after sufficient history using a median daily pace', () => {
    const regularDailyExpenses: Expense[] = Array.from({ length: 7 }, (_, index) => {
      const date = new Date('2026-10-11T00:00:00.000Z')
      date.setUTCDate(date.getUTCDate() + index)
      return {
        id: `daily-${index}`,
        amount: 200,
        category: 'Food',
        description: 'Groceries',
        date: date.toISOString().slice(0, 10),
      }
    })
    const metrics = calculateMetrics(
      regularDailyExpenses,
      '2026-10-11',
      '2026-10-18',
    )

    expect(metrics.forecastHistoryDays).toBe(7)
    expect(metrics.projectedFutureDiscretionary).toBe(4_600)
    expect(metrics.forecast).toBe(6_000)
  })

  it('reports a real projected shortfall when active future bills exceed available money', () => {
    const metrics = calculateMetrics(
      [{
        id: 'rent',
        amount: 9_900,
        category: 'Housing',
        description: 'Deposit',
        date: '2026-10-11',
      }],
      '2026-10-11',
      '2026-10-11',
      [{
        ...monthlySubscription,
        name: 'Essential bill',
        amount: 500,
        billingDate: '2026-10-12',
      }],
    )

    expect(metrics.remaining).toBe(100)
    expect(metrics.subscriptionCommitments).toBe(500)
    expect(metrics.forecast).toBe(10_400)
    expect(metrics.projectedRemaining).toBe(-400)
    expect(metrics.riskAssessment.status).toBe('Budget shortfall')
  })

  it('excludes cancelled subscriptions and bills already recorded as expenses', () => {
    const recordedBill: Expense = {
      id: 'music-expense',
      amount: 500,
      category: 'Bills',
      description: 'Music app',
      date: '2026-10-11',
    }
    expect(
      getUpcomingSubscriptionCommitments(
        [monthlySubscription],
        [recordedBill],
        '2026-10-11',
        '2026-10-11',
      ),
    ).toBe(0)
    expect(
      getUpcomingSubscriptionCommitments(
        [{ ...monthlySubscription, active: false }],
        [],
        '2026-10-11',
        '2026-10-11',
      ),
    ).toBe(0)
  })

  it('counts recurring weekly bills only through the current budget period', () => {
    const weekly: Subscription = {
      ...monthlySubscription,
      frequency: 'weekly',
      billingDate: '2026-10-11',
      amount: 100,
    }

    expect(
      getUpcomingSubscriptionCommitments(
        [weekly],
        [],
        '2026-10-11',
        '2026-10-11',
      ),
    ).toBe(500)
  })

  it('does not forecast a subscription expense twice when it is already recorded', () => {
    const weekly: Subscription = {
      ...monthlySubscription,
      frequency: 'weekly',
      billingDate: '2026-10-11',
      amount: 100,
    }
    const recordedBill: Expense = {
      id: 'weekly-bill',
      amount: 100,
      category: 'Bills',
      description: 'Music app',
      date: '2026-10-11',
    }
    const metrics = calculateMetrics(
      [recordedBill],
      '2026-10-11',
      '2026-10-11',
      [weekly],
    )

    expect(metrics.totalSpent).toBe(100)
    expect(metrics.subscriptionCommitments).toBe(400)
    expect(metrics.forecast).toBe(500)
  })

  it('matches a recorded Spotify payment to its next billing occurrence', () => {
    const spotify: Subscription = {
      ...monthlySubscription,
      name: 'Spotify',
      amount: 199,
      billingDate: '2026-11-05',
    }
    const recordedExpenses: Expense[] = [
      {
        id: 'medical',
        amount: 3_000,
        category: 'Health',
        description: 'Medical expense',
        date: '2026-10-11',
      },
      {
        id: 'medicines',
        amount: 200,
        category: 'Health',
        description: 'Medicines',
        date: '2026-10-11',
      },
      {
        id: 'spotify-payment',
        amount: 199,
        category: 'Bills',
        description: 'Spotify',
        date: '2026-10-11',
      },
    ]
    const metrics = calculateMetrics(
      recordedExpenses,
      '2026-10-11',
      '2026-10-11',
      [spotify],
    )

    expect(metrics.totalSpent).toBe(3_399)
    expect(metrics.subscriptionCommitments).toBe(0)
    expect(metrics.forecast).toBe(3_399)
  })

  it('keeps an unmatched upcoming bill and a later recurring occurrence committed', () => {
    const weeklySpotify: Subscription = {
      ...monthlySubscription,
      name: 'Spotify',
      amount: 199,
      billingDate: '2026-10-18',
      frequency: 'weekly',
    }
    const recordedPayment: Expense = {
      id: 'spotify-payment',
      amount: 199,
      category: 'Bills',
      description: 'Spotify',
      date: '2026-10-12',
    }

    expect(
      getUpcomingSubscriptionCommitments(
        [weeklySpotify],
        [],
        '2026-10-11',
        '2026-10-11',
      ),
    ).toBe(4 * 199)
    expect(
      getUpcomingSubscriptionCommitments(
        [weeklySpotify],
        [recordedPayment],
        '2026-10-10',
        '2026-10-14',
      ),
    ).toBe(3 * 199)
  })

  it('keeps a later monthly billing occurrence after matching the next one', () => {
    const monthlySpotify: Subscription = {
      ...monthlySubscription,
      name: 'Spotify',
      amount: 199,
      billingDate: '2027-01-31',
    }
    const recordedPayment: Expense = {
      id: 'spotify-payment',
      amount: 199,
      category: 'Bills',
      description: 'Spotify',
      date: '2027-01-30',
    }
    const metrics = calculateMetrics(
      [recordedPayment],
      '2027-01-30',
      '2027-01-30',
      [monthlySpotify],
    )

    expect(metrics.subscriptionCommitments).toBe(199)
    expect(metrics.forecast).toBe(398)
  })

  it('moves a recurring subscription date forward after a billing date passes', () => {
    expect(
      getNextSubscriptionBillingDate(monthlySubscription, '2026-11-12'),
    ).toBe('2026-12-11')
  })

  it('validates persisted goal and subscription shapes', () => {
    expect(
      isSavingsGoal({
        id: 'goal',
        name: 'Emergency fund',
        targetAmount: 5_000,
        savedAmount: 100,
      }),
    ).toBe(true)
    expect(
      isSavingsGoal({
        id: 'bad-goal',
        name: 'Trip',
        targetAmount: -1,
        savedAmount: 0,
      }),
    ).toBe(false)
    expect(isSubscription(monthlySubscription)).toBe(true)
    expect(isSubscription({ ...monthlySubscription, amount: 0 })).toBe(false)
  })

  it('explains risk using projected shortfalls and actionable next steps', () => {
    const onTrack = calculateMetrics([], '2026-10-11', '2026-10-11')
    const watch = calculateMetrics(
      [{ ...expenses[0], amount: 9_000 }],
      '2026-10-11',
      '2026-10-11',
    )
    const atRisk = calculateMetrics(
      [{ ...expenses[0], amount: 9_800 }],
      '2026-10-11',
      '2026-11-09',
      [{
        ...monthlySubscription,
        amount: 200,
        billingDate: '2026-11-09',
        frequency: 'yearly',
      }],
    )
    const shortfall = calculateMetrics(
      [{ ...expenses[0], amount: 10_100 }],
      '2026-10-11',
      '2026-10-11',
    )

    expect(onTrack.riskAssessment.status).toBe('On track')
    expect(watch.riskAssessment.status).toBe('Watch spending')
    expect(watch.riskAssessment.reason).toContain('daily')
    expect(atRisk.riskAssessment.status).toBe('At risk')
    expect(atRisk.riskAssessment.reason).toContain('subscription')
    expect(shortfall.riskAssessment.status).toBe('Budget shortfall')
    expect(shortfall.riskAssessment.action).toContain('Review')
  })
})
