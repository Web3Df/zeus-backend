const B = new Set([1,2,3,4,5,6,7,8]);
const M = new Set([9,10,11,12,13,14,15,16,17]);

export function normalizeGame(numbers) {
  if (!Array.isArray(numbers)) throw new TypeError('numbers must be an array');
  const game = [...new Set(numbers.map(Number))].sort((a,b) => a-b);
  if (game.length !== 15) throw new Error('game must contain 15 distinct numbers');
  if (game.some(n => !Number.isInteger(n) || n < 1 || n > 25)) {
    throw new Error('numbers must be integers between 1 and 25');
  }
  return game;
}

export function metricVector(numbers, previous = null) {
  const game = normalizeGame(numbers);
  const previousGame = previous ? normalizeGame(previous) : null;
  const repeated = previousGame ? game.filter(n => previousGame.includes(n)).length : null;
  const even = game.filter(n => n % 2 === 0).length;
  const bmt = game.reduce((acc, n) => {
    if (B.has(n)) acc.B += 1;
    else if (M.has(n)) acc.M += 1;
    else acc.T += 1;
    return acc;
  }, {B: 0, M: 0, T: 0});

  return {
    numbers: game,
    sum: game.reduce((a,b) => a+b, 0),
    parity: {even, odd: 15-even},
    bmt,
    repeated,
    new_numbers: repeated === null ? null : 15-repeated
  };
}

export function validateMetricVector(vector) {
  const errors = [];
  try { normalizeGame(vector.numbers); } catch (error) { errors.push(error.message); }
  if (vector.bmt.B + vector.bmt.M + vector.bmt.T !== 15) errors.push('B+M+T must equal 15');
  if (vector.parity.even + vector.parity.odd !== 15) errors.push('even+odd must equal 15');
  if (vector.repeated !== null && vector.repeated + vector.new_numbers !== 15) errors.push('R+N must equal 15');
  return {status: errors.length ? 'REPROVADO' : 'VALIDADO', errors};
}
