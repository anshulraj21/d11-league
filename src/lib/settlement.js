/**
 * Calculate prizes and settlements for a match.
 */

/**
 * Calculate prize amounts from pool and prize rules.
 * @param {number} entryFee - Entry fee per player
 * @param {number} playerCount - Number of players who joined
 * @param {Array<{rank: number, percentage: number}>} prizeRules - Prize distribution rules
 * @returns {Array<{rank: number, amount: number}>}
 */
export function calculatePrizes(entryFee, playerCount, prizeRules) {
  const pool = entryFee * playerCount
  return prizeRules.map((rule) => ({
    rank: rule.rank,
    amount: Math.round((pool * rule.percentage) / 100),
  }))
}

/**
 * Calculate net balance per player (prize won minus entry fee).
 * Positive = player is owed money. Negative = player owes money.
 * @param {Array<{userId: string, rank: number}>} results - Ranked results
 * @param {number} entryFee
 * @param {Array<{rank: number, amount: number}>} prizes
 * @returns {Array<{userId: string, balance: number}>}
 */
export function calculateNetBalances(results, entryFee, prizes) {
  const prizeMap = Object.fromEntries(prizes.map((p) => [p.rank, p.amount]))

  return results.map((r) => ({
    userId: r.userId,
    displayName: r.displayName,
    balance: (prizeMap[r.rank] || 0) - entryFee,
  }))
}

/**
 * Greedy algorithm to minimize number of settlement transactions.
 * Matches largest debtor with largest creditor repeatedly.
 * @param {Array<{userId: string, displayName: string, balance: number}>} balances
 * @returns {Array<{from: object, to: object, amount: number}>}
 */
export function computeSettlements(balances) {
  const creditors = balances
    .filter((b) => b.balance > 0)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.balance - a.balance)

  const debtors = balances
    .filter((b) => b.balance < 0)
    .map((b) => ({ ...b, balance: Math.abs(b.balance) }))
    .sort((a, b) => b.balance - a.balance)

  const settlements = []
  let i = 0, j = 0

  while (i < creditors.length && j < debtors.length) {
    const amount = Math.min(creditors[i].balance, debtors[j].balance)
    if (amount > 0) {
      settlements.push({
        from: { userId: debtors[j].userId, displayName: debtors[j].displayName },
        to: { userId: creditors[i].userId, displayName: creditors[i].displayName },
        amount,
      })
    }
    creditors[i].balance -= amount
    debtors[j].balance -= amount
    if (creditors[i].balance === 0) i++
    if (debtors[j].balance === 0) j++
  }

  return settlements
}

/**
 * Full settlement pipeline: results → prizes → balances → settlements.
 */
export function generateSettlements(results, entryFee, prizeRules) {
  const playerCount = results.length
  const prizes = calculatePrizes(entryFee, playerCount, prizeRules)
  const balances = calculateNetBalances(results, entryFee, prizes)
  const settlements = computeSettlements(balances)
  return { prizes, balances, settlements, pool: entryFee * playerCount }
}
