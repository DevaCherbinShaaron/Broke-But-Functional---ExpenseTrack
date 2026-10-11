import { useState } from 'react'
import { Dashboard } from './features/dashboard/Dashboard'
import { persistFinanceStartDate } from './lib/useFinanceData'
import { formatRupees } from './lib/formatRupees'

const plannedFeatures = [
  'A daily spending allowance that adjusts with your choices',
  'Savings goals, subscriptions, and unexpected expenses',
  'A clear forecast of how your month is shaping up',
]

function App() {
  const [showDashboard, setShowDashboard] = useState(false)
  const [startupStorageError, setStartupStorageError] = useState<string | null>(null)

  if (showDashboard) {
    return (
      <Dashboard
        onBack={() => setShowDashboard(false)}
        startupStorageError={startupStorageError}
      />
    )
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#10130f] px-5 py-8 text-stone-100 sm:px-8 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-5xl flex-col">
        <header className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-2xl bg-lime-300 text-lg font-black text-[#10130f]"
          >
            ₹
          </span>
          <span className="text-sm font-semibold tracking-wide">
            BROKE BUT FUNCTIONAL
          </span>
        </header>

        <section
          aria-labelledby="welcome-heading"
          className="my-auto grid gap-12 py-16 md:grid-cols-[1.15fr_0.85fr] md:items-center"
        >
          <div>
            <p className="mb-5 text-sm font-medium uppercase tracking-[0.22em] text-lime-300">
              Your month, made manageable
            </p>
            <h1
              className="max-w-2xl text-5xl font-semibold leading-[1.04] tracking-[-0.055em] sm:text-7xl"
              id="welcome-heading"
            >
              Make your money last the month.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-stone-400 sm:text-lg">
              A calmer way to make ₹10,000 work for 30 days. Start with a plan,
              then let the numbers keep up with real life.
            </p>
            <button
              className="mt-8 rounded-full bg-lime-300 px-6 py-3.5 text-sm font-semibold text-[#10130f] transition hover:bg-lime-200"
              onClick={() => {
                setStartupStorageError(persistFinanceStartDate())
                setShowDashboard(true)
              }}
              type="button"
            >
              Start my month
            </button>
          </div>

          <aside
            aria-label="Planned dashboard features"
            className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-8"
          >
            <p className="text-sm text-stone-400">This month starts with</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-lime-300">
              {formatRupees(10_000)}
            </p>
            <p className="mt-1 text-sm text-stone-500">30 days to make it count</p>
            <div className="my-7 h-px bg-white/10" />
            <h2 className="text-sm font-semibold text-stone-200">
              Built for the whole picture
            </h2>
            <ul className="mt-4 space-y-4">
              {plannedFeatures.map((feature) => (
                <li
                  className="flex gap-3 text-sm leading-6 text-stone-400"
                  key={feature}
                >
                  <span
                    aria-hidden="true"
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-lime-300"
                  />
                  {feature}
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-xs text-stone-500">
          <span>Small steps. Fewer money surprises.</span>
          <span>Made for real life in India.</span>
        </footer>
      </div>
    </main>
  )
}

export default App
