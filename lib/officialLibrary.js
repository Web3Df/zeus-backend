import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const INTERNAL_LIBRARY_ROOT = path.resolve(MODULE_DIR, '..', 'biblioteca_oficial');

function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

export async function locateOfficialLibrary() {
  const root = INTERNAL_LIBRARY_ROOT;
  const manifestPath = path.join(root, 'manifest.json');

  try {
    await access(manifestPath);
  } catch {
    throw new Error(`BIBLIOTECA_OFICIAL_INTERNA_NAO_LOCALIZADA: ${manifestPath}`);
  }

  return Object.freeze({ root, manifestPath, origin: 'INTERNA_AUTOSSUFICIENTE' });
}

export async function loadOfficialLibrary() {
  const location = await locateOfficialLibrary();
  const rawManifest = await readFile(location.manifestPath, 'utf8');
  const manifest = JSON.parse(rawManifest);

  if (manifest.libraryId !== 'BIBLIOTECA_OFICIAL_ZEUS') {
    throw new Error('MANIFESTO_BIBLIOTECA_INVALIDO: libraryId inesperado');
  }

  if (manifest.origin !== 'INTERNA_AUTOSSUFICIENTE') {
    throw new Error('MANIFESTO_BIBLIOTECA_INVALIDO: origem deve ser INTERNA_AUTOSSUFICIENTE');
  }

  if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length === 0) {
    throw new Error('MANIFESTO_BIBLIOTECA_INVALIDO: nenhum artefato declarado');
  }

  const components = new Map();
  const validations = [];

  for (const artifact of manifest.artifacts) {
    const artifactPath = path.resolve(location.root, artifact.path);
    const relative = path.relative(location.root, artifactPath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`CAMINHO_ARTEFATO_INVALIDO: ${artifact.path}`);
    }

    let content;
    try {
      content = await readFile(artifactPath);
    } catch {
      if (artifact.required) {
        throw new Error(`ARTEFATO_OBRIGATORIO_AUSENTE: ${artifact.id}`);
      }
      continue;
    }

    const calculatedSha256 = sha256(content);
    if (calculatedSha256 !== artifact.sha256) {
      throw new Error(
        `INTEGRIDADE_REPROVADA: ${artifact.id} esperado=${artifact.sha256} calculado=${calculatedSha256}`
      );
    }

    const module = await import(`${pathToFileURL(artifactPath).href}?sha256=${calculatedSha256}`);
    const component = module[artifact.export];
    if (component === undefined) {
      throw new Error(`EXPORTACAO_AUSENTE: ${artifact.id}::${artifact.export}`);
    }

    components.set(artifact.id, component);
    validations.push(Object.freeze({
      id: artifact.id,
      version: artifact.version,
      path: artifact.path,
      sha256: calculatedSha256,
      status: 'APROVADO'
    }));
  }

  return Object.freeze({
    libraryId: manifest.libraryId,
    version: manifest.version,
    origin: location.origin,
    root: location.root,
    components,
    validations: Object.freeze(validations),
    status: 'INTEGRIDADE_APROVADA'
  });
}

export async function prepareOfficialExecution() {
  const library = await loadOfficialLibrary();
  if (library.components.size === 0) {
    throw new Error('EXECUCAO_BLOQUEADA: biblioteca sem componentes reutilizaveis');
  }
  return library;
}
