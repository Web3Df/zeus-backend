export const ZEUS_LIBRARY_COMPONENT = Object.freeze({
  id: 'ARQUITETURA_BIBLIOTECA_OFICIAL_ZEUS_V1',
  version: '1.0.0',
  status: 'OFICIAL',
  mandatoryStartupSequence: Object.freeze([
    'LOCALIZAR',
    'CARREGAR',
    'VALIDAR_INTEGRIDADE',
    'REUTILIZAR_COMPONENTES',
    'LIBERAR_EXECUCAO'
  ])
});
