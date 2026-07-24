import assert from 'node:assert/strict';
import test from 'node:test';
import { locateOfficialLibrary, prepareOfficialExecution } from '../lib/officialLibrary.js';

test('localiza a Biblioteca Oficial ZEUS interna', async () => {
  const location = await locateOfficialLibrary();
  assert.equal(location.origin, 'INTERNA_AUTOSSUFICIENTE');
  assert.match(location.manifestPath, /biblioteca_oficial[\\/]manifest\.json$/);
});

test('carrega, valida e reutiliza componentes antes da execução', async () => {
  const library = await prepareOfficialExecution();
  assert.equal(library.libraryId, 'BIBLIOTECA_OFICIAL_ZEUS');
  assert.equal(library.origin, 'INTERNA_AUTOSSUFICIENTE');
  assert.equal(library.status, 'INTEGRIDADE_APROVADA');
  assert.equal(library.validations.length, 1);
  assert.equal(library.validations[0].status, 'APROVADO');

  const component = library.components.get('ARQUITETURA_BIBLIOTECA_OFICIAL_ZEUS_V1');
  assert.ok(component);
  assert.deepEqual(component.mandatoryStartupSequence, [
    'LOCALIZAR',
    'CARREGAR',
    'VALIDAR_INTEGRIDADE',
    'REUTILIZAR_COMPONENTES',
    'LIBERAR_EXECUCAO'
  ]);
});
