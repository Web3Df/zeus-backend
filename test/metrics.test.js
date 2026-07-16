import test from 'node:test';
import assert from 'node:assert/strict';
import {metricVector, validateMetricVector} from '../src/domain/metrics.js';
import {processOfficialResult} from '../src/core/orchestrator.js';

const current = [3,4,6,7,8,9,11,12,14,17,18,19,21,22,23];
const previous = [3,5,7,12,14,15,16,17,18,20,21,22,23,24,25];

test('extracts consistent MetricVector', () => {
  const vector = metricVector(current, previous);
  assert.equal(vector.numbers.length, 15);
  assert.equal(vector.bmt.B + vector.bmt.M + vector.bmt.T, 15);
  assert.equal(vector.parity.even + vector.parity.odd, 15);
  assert.equal(vector.repeated + vector.new_numbers, 15);
  assert.deepEqual(validateMetricVector(vector), {status: 'VALIDADO', errors: []});
});

test('rejects duplicate or incomplete games', () => {
  assert.throws(() => metricVector([1,1,2]), /15 distinct/);
});

test('produces traceable deterministic structure', () => {
  const event = processOfficialResult({contest: 3736, numbers: current, previousNumbers: previous, source: 'test'});
  assert.equal(event.contest, 3736);
  assert.equal(event.validation.status, 'VALIDADO');
  assert.match(event.checksum_sha256, /^[a-f0-9]{64}$/);
  assert.ok(event.execution_id);
});
