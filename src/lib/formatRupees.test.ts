import { describe, expect, it } from 'vitest'
import { formatRupees } from './formatRupees'

describe('formatRupees', () => {
  it('formats amounts using the Indian numbering system', () => {
    expect(formatRupees(10_000)).toBe('₹10,000')
  })
})
