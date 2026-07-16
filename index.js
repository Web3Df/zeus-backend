import express from 'express';
import {processOfficialResult} from './src/core/orchestrator.js';
import {appendEvent, readEvents} from './src/storage/eventStore.js';

const app = express();
app.use(express.json({limit: '64kb'}));

app.get('/health', (_req, res) => res.json({service: 'zeus-backend', status: 'UP', version: '1.1.0'}));

app.post('/v1/results/official', async (req, res) => {
  try {
    const event = processOfficialResult(req.body);
    const persistence = await appendEvent(event);
    res.status(201).json({event, persistence});
  } catch (error) {
    res.status(400).json({status: 'REPROVADO', error: error.message, validation: error.validation ?? null});
  }
});

app.get('/v1/events', async (_req, res) => {
  res.json({events: await readEvents()});
});

app.use((_req, res) => res.status(404).json({error: 'NOT_FOUND'}));

const PORT = Number(process.env.PORT || 3000);
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`ZEUS backend listening on ${PORT}`));
}

export default app;
