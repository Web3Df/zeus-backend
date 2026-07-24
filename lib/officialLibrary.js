import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_LIBRARY_ROOT = path.resolve(process.cwd(), 'biblioteca_oficial');

function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

export async function locateOfficialLibrary() {
  const root = path.resolve(process.env.ZEUS_OFFICIAL_LIBRARY_PATH || DEFAULT_LIBRARY_ROOT);
  const manifestPath = path.join(root, 'manifest.json');

  try {
    await access(manifestPath);
  } catch {
    throw new Error(`BIBLIOTECA_OFICIAL_NAO_LOCALIZADA: ${manifestPath}`);
  }

  return { root, manifestPath };
}

export async function loadOfficialLibrary() {
  const location = await locateOfficialLibrary();
  const rawManifest = await readFile(location.manifestPath, 'utf8');
  const manifest = JSON.parse(rawManifest);

  if (manifest.libraryId !== 'BIBLIOTECA_OFICIAL_ZEUS') {
    throw new Error('MANIFESTO_BIBLIOTECA_INVALIDO: libraryId inesperado');
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
    } catch (error) {
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

    const module = await import(pathToFileURL(artifactPath).href);
    const component = module[artifact.export];
    if (component === undefined) {
      throw new Error(`EXPORTACAO_AUSENTE: ${artifact.id}::${artifact.export}`);
    }

    components.set(artifact.id, component);
    validations.push({
      id: artifact.id,
      version: artifact.version,
      path: artifact.path,
      sha256: calculatedSha256,
      status: 'APROVADO'
    });
  }

  return Object.freeze({
    libraryId: manifest.libraryId,
    version: manifest.version,
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
