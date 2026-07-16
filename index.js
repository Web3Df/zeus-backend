import express from 'express';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const app = express();
app.use(express.json({ limit: '5mb' }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTIFACT_DIR = path.resolve(process.env.ZEUS_ARTIFACT_DIR || path.join(__dirname, 'artifacts'));
const WRITE_TOKEN = process.env.ZEUS_WRITE_TOKEN || '';

const safeId = value => /^[A-Za-z0-9._-]+$/.test(value || '');
const artifactPath = id => path.join(ARTIFACT_DIR, `${id}.json`);

async function ensureLibrary() {
  await fs.mkdir(ARTIFACT_DIR, { recursive: true });
}

async function readArtifact(id) {
  if (!safeId(id)) return null;
  try {
    return JSON.parse(await fs.readFile(artifactPath(id), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function listArtifacts() {
  await ensureLibrary();
  const files = (await fs.readdir(ARTIFACT_DIR)).filter(name => name.endsWith('.json'));
  const artifacts = [];
  for (const file of files) {
    const content = JSON.parse(await fs.readFile(path.join(ARTIFACT_DIR, file), 'utf8'));
    artifacts.push({
      artifact_id: content.artifact_id,
      artifact_type: content.artifact_type,
      contest: content.contest,
      execution_id: content.execution_id,
      created_at: content.created_at,
      checksum: content.checksum,
    });
  }
  return artifacts.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}

function requireWriteToken(req, res, next) {
  if (!WRITE_TOKEN) return res.status(503).json({ error: 'WRITE_ACCESS_DISABLED' });
  const token = req.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (token !== WRITE_TOKEN) return res.status(401).json({ error: 'UNAUTHORIZED' });
  next();
}

app.get('/', (_req, res) => res.json({ service: 'ZEUS Executor', status: 'active' }));
app.get('/health', (_req, res) => res.json({ status: 'ok', artifact_dir: ARTIFACT_DIR }));

app.get('/api/v1/artifacts', async (req, res, next) => {
  try {
    const contest = req.query.contest ? Number(req.query.contest) : null;
    const type = req.query.type ? String(req.query.type) : null;
    let artifacts = await listArtifacts();
    if (Number.isInteger(contest)) artifacts = artifacts.filter(item => item.contest === contest);
    if (type) artifacts = artifacts.filter(item => item.artifact_type === type);
    res.json({ count: artifacts.length, artifacts });
  } catch (error) {
    next(error);
  }
});

app.get('/api/v1/artifacts/:artifactId', async (req, res, next) => {
  try {
    const artifact = await readArtifact(req.params.artifactId);
    if (!artifact) return res.status(404).json({ error: 'ARTIFACT_NOT_FOUND' });
    res.json(artifact);
  } catch (error) {
    next(error);
  }
});

app.get('/api/v1/contests/:contest/ranking', async (req, res, next) => {
  try {
    const contest = Number(req.params.contest);
    if (!Number.isInteger(contest) || contest < 1) return res.status(400).json({ error: 'INVALID_CONTEST' });
    const artifacts = (await listArtifacts()).filter(
      item => item.contest === contest && item.artifact_type === 'ranking',
    );
    if (!artifacts.length) return res.status(404).json({ error: 'RANKING_NOT_MATERIALIZED', contest });
    const ranking = await readArtifact(artifacts[0].artifact_id);
    res.json(ranking);
  } catch (error) {
    next(error);
  }
});

app.post('/api/v1/artifacts', requireWriteToken, async (req, res, next) => {
  try {
    const { artifact_id, artifact_type, contest, execution_id, payload, provenance = {} } = req.body || {};
    if (!safeId(artifact_id)) return res.status(400).json({ error: 'INVALID_ARTIFACT_ID' });
    if (!safeId(artifact_type)) return res.status(400).json({ error: 'INVALID_ARTIFACT_TYPE' });
    if (!Number.isInteger(contest) || contest < 1) return res.status(400).json({ error: 'INVALID_CONTEST' });
    if (!safeId(execution_id)) return res.status(400).json({ error: 'INVALID_EXECUTION_ID' });
    if (payload === undefined) return res.status(400).json({ error: 'PAYLOAD_REQUIRED' });

    await ensureLibrary();
    const created_at = new Date().toISOString();
    const checksum = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    const artifact = {
      schema_version: 'ZEUS_ARTIFACT_V1',
      artifact_id,
      artifact_type,
      contest,
      execution_id,
      created_at,
      checksum,
      provenance,
      payload,
    };
    await fs.writeFile(artifactPath(artifact_id), `${JSON.stringify(artifact, null, 2)}\n`, { flag: 'wx' });
    res.status(201).json(artifact);
  } catch (error) {
    if (error.code === 'EEXIST') return res.status(409).json({ error: 'ARTIFACT_ALREADY_EXISTS' });
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'INTERNAL_ERROR' });
});

const PORT = Number(process.env.PORT || 3000);
ensureLibrary()
  .then(() => app.listen(PORT, () => console.log(`ZEUS Executor rodando na porta ${PORT}`)))
  .catch(error => {
    console.error('Falha ao inicializar biblioteca ZEUS:', error);
    process.exit(1);
  });
