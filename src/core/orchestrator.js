import {createHash, randomUUID} from 'node:crypto';
import {metricVector, validateMetricVector} from '../domain/metrics.js';

export function processOfficialResult({contest, numbers, previousNumbers = null, source = 'manual'}) {
  if (!Number.isInteger(Number(contest))) throw new Error('contest must be an integer');
  const vector = metricVector(numbers, previousNumbers);
  const validation = validateMetricVector(vector);
  if (validation.status !== 'VALIDADO') {
    const error = new Error('MetricVector rejected');
    error.validation = validation;
    throw error;
  }

  const payload = {
    schema_version: 'ZEUS_EVENT_V1',
    execution_id: randomUUID(),
    contest: Number(contest),
    source,
    created_at: new Date().toISOString(),
    metric_vector: vector,
    validation
  };
  payload.checksum_sha256 = createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex');
  return payload;
}
