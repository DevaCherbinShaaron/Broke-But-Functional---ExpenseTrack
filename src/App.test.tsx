import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { getToday } from './features/finance/finance'

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('welcomes users and shows the monthly budget in rupees', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: /make your money last the month/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('₹10,000')).toBeInTheDocument()
  })

  it('adds and deletes an expense while keeping dashboard metrics in sync', async () => {
    const { unmount } = render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Start my month' }))
    expect(screen.getByRole('heading', { name: 'You have got this.' })).toBeInTheDocument()
    expect(
      screen.getByRole('status', { name: 'financial risk assessment: On track' }),
    ).toBeInTheDocument()
    expect(window.localStorage.getItem('broke-but-functional.finance.v1')).toContain(
      '"startDate"',
    )

    fireEvent.change(screen.getByPlaceholderText('e.g. 250'), { target: { value: '500' } })
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Lunch' },
    })
    fireEvent.change(screen.getByLabelText('Category'), {
      target: { value: 'Food' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add expense' }))

    expect(screen.getByText('−₹500')).toBeInTheDocument()
    expect(screen.getByText('₹9,500')).toBeInTheDocument()
    expect(screen.getAllByText('₹500').length).toBeGreaterThan(0)
    expect(screen.getByRole('img', { name: 'Food: 100% of spending' })).toBeInTheDocument()
    await waitFor(() => {
      expect(window.localStorage.getItem('broke-but-functional.finance.v1')).toContain(
        '"description":"Lunch"',
      )
    })

    unmount()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Start my month' }))
    expect(screen.getByText('−₹500')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Delete Lunch' }))
    expect(screen.getByText('No expenses yet. Add your first one to see your month take shape.')).toBeInTheDocument()
    expect(screen.getAllByText('₹10,000')).toHaveLength(2)
    await waitFor(() => {
      expect(window.localStorage.getItem('broke-but-functional.finance.v1')).not.toContain(
        '"description":"Lunch"',
      )
    })
  })

  it('does not add zero or negative expenses', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Start my month' }))
    fireEvent.change(screen.getByPlaceholderText('e.g. 250'), { target: { value: '-50' } })
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Invalid item' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add expense' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Enter an amount greater than ₹0.')
    expect(screen.getByText('0 expenses')).toBeInTheDocument()
    expect(
      screen.getByText(/only starts after 7 days of history/i),
    ).toBeInTheDocument()
  })

  it('keeps a purchase simulation separate until the user commits it', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Start my month' }))
    const savedBeforeSimulation = window.localStorage.getItem(
      'broke-but-functional.finance.v1',
    )

    fireEvent.change(screen.getByPlaceholderText('e.g. 1,200'), { target: { value: '1200' } })
    fireEvent.change(screen.getByLabelText(/What are you thinking of buying/), {
      target: { value: 'Headphones' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Preview purchase' }))

    expect(screen.getByRole('region', { name: 'Simulated purchase outcome' })).toBeInTheDocument()
    expect(screen.getByText('₹8,800')).toBeInTheDocument()
    expect(screen.getByText('₹1,200')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Simulated financial health: Watch spending' })).toBeInTheDocument()
    expect(screen.getByText('0 expenses')).toBeInTheDocument()
    expect(
      window.localStorage.getItem('broke-but-functional.finance.v1'),
    ).toBe(savedBeforeSimulation)

    fireEvent.click(screen.getByRole('button', { name: 'Commit this expense' }))
    expect(screen.getByText('Headphones')).toBeInTheDocument()
    expect(screen.getByText('−₹1,200')).toBeInTheDocument()
    expect(screen.getByText('₹8,800')).toBeInTheDocument()
    await waitFor(() => {
      expect(window.localStorage.getItem('broke-but-functional.finance.v1')).toContain(
        '"description":"Headphones"',
      )
    })
  })

  it('blocks a simulation that exceeds the remaining budget and can cancel it safely', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Start my month' }))
    const savedBeforeSimulation = window.localStorage.getItem(
      'broke-but-functional.finance.v1',
    )

    fireEvent.change(screen.getByPlaceholderText('e.g. 1,200'), { target: { value: '10001' } })
    fireEvent.change(screen.getByLabelText(/What are you thinking of buying/), {
      target: { value: 'Too expensive' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Preview purchase' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'This purchase is more than your available balance of ₹10,000.',
    )
    expect(screen.getByRole('button', { name: 'Commit this expense' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel simulation' }))

    expect(screen.queryByRole('region', { name: 'Simulated purchase outcome' })).not.toBeInTheDocument()
    expect(screen.getByText('0 expenses')).toBeInTheDocument()
    expect(
      window.localStorage.getItem('broke-but-functional.finance.v1'),
    ).toBe(savedBeforeSimulation)
  })

  it('creates, recalculates, persists, and deletes savings goals without booking expenses', async () => {
    const { unmount } = render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Start my month' }))

    fireEvent.change(screen.getByLabelText('Goal name'), {
      target: { value: 'Emergency fund' },
    })
    fireEvent.change(screen.getByLabelText('Target amount'), {
      target: { value: '10000' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create savings goal' }))

    expect(screen.getByText('Emergency fund')).toBeInTheDocument()
    expect(screen.getByText('Achievable in this budget')).toBeInTheDocument()
    expect(screen.getByText('₹10,000 to go')).toBeInTheDocument()
    expect(screen.getByText('0 expenses')).toBeInTheDocument()
    await waitFor(() => {
      expect(window.localStorage.getItem('broke-but-functional.finance.v1')).toContain(
        '"name":"Emergency fund"',
      )
    })

    fireEvent.change(screen.getByPlaceholderText('e.g. 250'), {
      target: { value: '500' },
    })
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Groceries' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add expense' }))
    expect(screen.getByText('Beyond this budget')).toBeInTheDocument()

    unmount()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Start my month' }))
    expect(screen.getByText('Emergency fund')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Delete Emergency fund goal' }))
    expect(screen.queryByText('Emergency fund')).not.toBeInTheDocument()
    await waitFor(() => {
      expect(window.localStorage.getItem('broke-but-functional.finance.v1')).not.toContain(
        '"name":"Emergency fund"',
      )
    })
  })

  it('persists subscriptions, includes active bills in forecasts, and removes impact when cancelled', async () => {
    const { unmount } = render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Start my month' }))

    fireEvent.change(screen.getByLabelText('Subscription name'), {
      target: { value: 'Music app' },
    })
    fireEvent.change(screen.getByLabelText('Billing amount'), {
      target: { value: '4000' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add subscription' }))

    expect(screen.getByText('Music app')).toBeInTheDocument()
    expect(
      screen.getByText('Includes ₹4,000 in upcoming subscriptions'),
    ).toBeInTheDocument()
    expect(screen.getByText('₹200')).toBeInTheDocument()
    expect(screen.getByText('0 expenses')).toBeInTheDocument()
    await waitFor(() => {
      expect(window.localStorage.getItem('broke-but-functional.finance.v1')).toContain(
        '"name":"Music app"',
      )
    })

    fireEvent.click(screen.getByRole('button', { name: 'Cancel Music app' }))
    expect(screen.getByText('Cancelled')).toBeInTheDocument()
    expect(
      screen.queryByText('Includes ₹4,000 in upcoming subscriptions'),
    ).not.toBeInTheDocument()
    expect(screen.getByText('₹333')).toBeInTheDocument()

    unmount()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Start my month' }))
    expect(screen.getByText('Cancelled')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Delete Music app' }))
    expect(screen.queryByText('Music app')).not.toBeInTheDocument()
    await waitFor(() => {
      expect(window.localStorage.getItem('broke-but-functional.finance.v1')).not.toContain(
        '"name":"Music app"',
      )
    })
  })

  it('rejects invalid goal and subscription amounts', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Start my month' }))

    fireEvent.change(screen.getByLabelText('Goal name'), {
      target: { value: 'Rainy day' },
    })
    fireEvent.change(screen.getByLabelText('Target amount'), {
      target: { value: '0' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create savings goal' }))
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter a target amount in whole rupees greater than ₹0.',
    )

    fireEvent.change(screen.getByLabelText('Subscription name'), {
      target: { value: 'Video app' },
    })
    fireEvent.change(screen.getByLabelText('Billing amount'), {
      target: { value: '-50' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add subscription' }))
    expect(
      screen.getByText('Enter a subscription amount in whole rupees greater than ₹0.'),
    ).toHaveAttribute('role', 'alert')
    expect(screen.getByText('0 expenses')).toBeInTheDocument()
    expect(
      window.localStorage.getItem('broke-but-functional.finance.v1'),
    ).not.toContain('"name":"Rainy day"')
  })

  it('loads expenses saved by the earlier data format without losing them', () => {
    window.localStorage.setItem(
      'broke-but-functional.finance.v1',
      JSON.stringify({
        startDate: '2026-10-11',
        expenses: [
          {
            id: 'legacy-expense',
            amount: 250,
            category: 'Food',
            description: 'Legacy lunch',
            date: '2026-10-11',
          },
        ],
      }),
    )
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Start my month' }))

    expect(screen.getByText('Legacy lunch')).toBeInTheDocument()
    expect(screen.getByText('−₹250')).toBeInTheDocument()
    expect(screen.getByText('No subscriptions added yet.')).toBeInTheDocument()
  })

  it('persists one start date across returning to the landing page and reopening the dashboard', () => {
    const startDate = getToday()
    const savedData = {
      startDate,
      expenses: [{
        id: 'saved-expense',
        amount: 250,
        category: 'Food',
        description: 'Saved lunch',
        date: startDate,
      }],
      goals: [{
        id: 'saved-goal',
        name: 'Rainy day',
        targetAmount: 1_000,
        savedAmount: 100,
      }],
      subscriptions: [{
        id: 'saved-subscription',
        name: 'Music',
        amount: 100,
        billingDate: startDate,
        frequency: 'monthly',
        active: true,
      }],
    }
    window.localStorage.setItem(
      'broke-but-functional.finance.v1',
      JSON.stringify(savedData),
    )

    const { unmount } = render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Start my month' }))
    expect(screen.getByText(/Day 1 of 30/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Back to home' }))
    fireEvent.click(screen.getByRole('button', { name: 'Start my month' }))
    expect(screen.getByText(/Day 1 of 30/)).toBeInTheDocument()
    expect(screen.getByText('Saved lunch')).toBeInTheDocument()
    expect(screen.getByText('Rainy day')).toBeInTheDocument()
    expect(screen.getByText('Music')).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem('broke-but-functional.finance.v1') ?? '{}'))
      .toMatchObject(savedData)

    unmount()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Start my month' }))
    expect(screen.getByText(/Day 1 of 30/)).toBeInTheDocument()
  })

  it('repairs an invalid saved start date without discarding other saved finance data', () => {
    const today = getToday()
    window.localStorage.setItem(
      'broke-but-functional.finance.v1',
      JSON.stringify({
        startDate: '2026-02-30',
        expenses: [{
          id: 'kept-expense',
          amount: 150,
          category: 'Food',
          description: 'Kept lunch',
          date: today,
        }],
        goals: [{
          id: 'kept-goal',
          name: 'Kept goal',
          targetAmount: 500,
          savedAmount: 50,
        }],
        subscriptions: [],
      }),
    )

    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Start my month' }))

    expect(screen.getByText('Kept lunch')).toBeInTheDocument()
    expect(screen.getByText('Kept goal')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('saved finance data was kept')
    expect(
      JSON.parse(
        window.localStorage.getItem('broke-but-functional.finance.v1') ?? '{}',
      ),
    ).toMatchObject({
      startDate: today,
      expenses: [{ id: 'kept-expense' }],
      goals: [{ id: 'kept-goal' }],
    })
  })

  it('previews and cancels an unexpected expense without saving any actual changes', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Start my month' }))
    const savedBeforePreview = window.localStorage.getItem(
      'broke-but-functional.finance.v1',
    )

    fireEvent.click(screen.getByRole('button', { name: /Medical bill/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Preview impact' }))

    expect(
      screen.getByRole('region', { name: 'Unexpected expense simulation' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Preview remaining balance')).toBeInTheDocument()
    expect(screen.getByText('Preview safe daily spend')).toBeInTheDocument()
    expect(screen.getByText('Upcoming subscriptions')).toBeInTheDocument()
    expect(screen.getByText('Preview month-end forecast')).toBeInTheDocument()
    expect(
      screen.getByRole('status', {
        name: 'Simulated financial risk assessment: Watch spending',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('0 expenses')).toBeInTheDocument()
    expect(
      window.localStorage.getItem('broke-but-functional.finance.v1'),
    ).toBe(savedBeforePreview)

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(
      screen.queryByRole('region', { name: 'Unexpected expense simulation' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('0 expenses')).toBeInTheDocument()
    expect(
      window.localStorage.getItem('broke-but-functional.finance.v1'),
    ).toBe(savedBeforePreview)
  })

  it('confirms an unexpected expense once and updates the real balance and risk status', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Start my month' }))
    fireEvent.click(screen.getByRole('button', { name: /Device repair/ }))
    fireEvent.change(screen.getByPlaceholderText('e.g. 2,000'), {
      target: { value: '12000' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Preview impact' }))

    expect(screen.getByText('Preview remaining balance')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'This expense exceeds your current remaining balance by ₹2,000.',
    )
    const confirmButton = screen.getByRole('button', {
      name: 'Confirm unexpected expense',
    })
    fireEvent.click(confirmButton)
    fireEvent.click(confirmButton)

    expect(screen.getByText('1 expense')).toBeInTheDocument()
    expect(screen.getByText('Unexpected: Device repair')).toBeInTheDocument()
    expect(screen.getByText('−₹12,000')).toBeInTheDocument()
    expect(screen.getAllByText('Budget shortfall').length).toBeGreaterThan(0)
    await waitFor(() => {
      const stored = window.localStorage.getItem('broke-but-functional.finance.v1')
      expect(stored).toContain('"description":"Unexpected: Device repair"')
      expect(stored?.match(/Unexpected: Device repair/g)).toHaveLength(1)
    })
  })

  it('shows actual goals and subscription commitments in an unexpected-cost preview', () => {
    const today = new Date()
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    window.localStorage.setItem(
      'broke-but-functional.finance.v1',
      JSON.stringify({
        startDate: todayString,
        expenses: [],
        goals: [{
          id: 'trip',
          name: 'Weekend trip',
          targetAmount: 9_000,
          savedAmount: 0,
        }],
        subscriptions: [{
          id: 'cloud',
          name: 'Cloud storage',
          amount: 600,
          billingDate: todayString,
          frequency: 'yearly',
          active: true,
        }],
      }),
    )
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Start my month' }))
    fireEvent.click(screen.getByRole('button', { name: /Emergency travel/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Preview impact' }))

    expect(screen.getByText('Upcoming subscriptions')).toBeInTheDocument()
    expect(screen.getAllByText('Weekend trip')).toHaveLength(2)
    expect(screen.getByText('Would need ₹9,000; projected funds ₹7,900')).toBeInTheDocument()
    expect(screen.getAllByText('₹600').length).toBeGreaterThan(0)
    expect(screen.getByText('0 expenses')).toBeInTheDocument()
  })

  it('rejects invalid unexpected expense amounts', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Start my month' }))
    fireEvent.change(screen.getByPlaceholderText('e.g. 2,000'), {
      target: { value: '-1' },
    })
    fireEvent.change(screen.getByPlaceholderText('Describe the unexpected cost'), {
      target: { value: 'Emergency' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Preview impact' }))

    expect(
      screen.getByText('Enter a whole-rupee amount greater than ₹0.'),
    ).toHaveAttribute('role', 'alert')
    expect(screen.getByText('0 expenses')).toBeInTheDocument()
  })
})
