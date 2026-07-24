import express from 'express';
import { prepareOfficialExecution } from './lib/officialLibrary.js';

async function bootstrap() {
  const officialLibrary = await prepareOfficialExecution();
  const app = express();

  app.locals.officialLibrary = officialLibrary;

  app.get('/', (req, res) => {
    res.json({
      executor: 'ZEUS',
      status: 'ATIVO',
      executionGate: 'LIBERADA',
      officialLibrary: {
        id: officialLibrary.libraryId,
        version: officialLibrary.version,
        integrity: officialLibrary.status,
        artifactsLoaded: officialLibrary.components.size,
        validations: officialLibrary.validations
      }
    });
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(
      JSON.stringify({
        event: 'EXECUCAO_ZEUS_LIBERADA',
        port: Number(PORT),
        libraryId: officialLibrary.libraryId,
        libraryVersion: officialLibrary.version,
        integrity: officialLibrary.status,
        artifactsLoaded: officialLibrary.components.size
      })
    );
  });
}

bootstrap().catch((error) => {
  console.error(
    JSON.stringify({
      event: 'EXECUCAO_ZEUS_BLOQUEADA',
      reason: error.message
    })
  );
  process.exit(1);
});
