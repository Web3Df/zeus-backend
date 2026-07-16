# ZEUS Backend

Núcleo mínimo executável e auditável do ZEUS GLOBAL.

## Estado real

Implementado nesta versão:

- ingestão de resultado oficial por API;
- validação de 15 dezenas distintas no intervalo 01–25;
- MetricVector com soma, paridade, BMT e R/N;
- bloqueio de MetricVector inconsistente;
- `execution_id`, timestamp, versão de schema e SHA-256;
- persistência append-only em JSONL;
- consulta do EVENT_LOG;
- testes automatizados e CI.

Ainda não implementado:

- coleta automática da Caixa;
- BASE_ATIVA histórica completa;
- MEE e Rede ZEUS;
- gerador/materializador de CandidateSet;
- auditoria K13/K14/K15;
- publicação automática da Biblioteca Oficial.

## Executar

```bash
npm install
npm test
npm start
```

## API

`GET /health`

`POST /v1/results/official`

```json
{
  "contest": 3736,
  "numbers": [3,4,6,7,8,9,11,12,14,17,18,19,21,22,23],
  "previousNumbers": [3,5,7,12,14,15,16,17,18,20,21,22,23,24,25],
  "source": "official"
}
```

`GET /v1/events`

## Regra de homologação

Nenhuma capacidade é considerada operacional sem código versionado, teste automatizado e artefato persistido correspondente.
