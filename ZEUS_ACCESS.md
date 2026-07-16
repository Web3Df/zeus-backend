# ZEUS — Acesso à Biblioteca Oficial

## Estado implantado

A API fornece acesso determinístico aos artefatos materializados no diretório configurado por `ZEUS_ARTIFACT_DIR`.

Nenhum ranking é inventado. Quando o artefato não existe, a API retorna `RANKING_NOT_MATERIALIZED`.

## Variáveis de ambiente

- `PORT`: porta HTTP; padrão `3000`.
- `ZEUS_ARTIFACT_DIR`: diretório persistente da biblioteca; padrão `./artifacts`.
- `ZEUS_WRITE_TOKEN`: token obrigatório para publicação de artefatos. Sem ele, a escrita permanece bloqueada.

## Endpoints

### Saúde

`GET /health`

### Listar artefatos

`GET /api/v1/artifacts`

Filtros opcionais:

- `contest=3737`
- `type=ranking`

### Resolver artefato

`GET /api/v1/artifacts/{artifact_id}`

### Ranking oficial de um concurso

`GET /api/v1/contests/{contest}/ranking`

A resposta utiliza o ranking materializado mais recente do concurso.

### Publicar artefato

`POST /api/v1/artifacts`

Cabeçalho:

`Authorization: Bearer <ZEUS_WRITE_TOKEN>`

Corpo mínimo:

```json
{
  "artifact_id": "ranking_3737_exec_001",
  "artifact_type": "ranking",
  "contest": 3737,
  "execution_id": "exec_3737_001",
  "provenance": {
    "base_active": "3675-3736",
    "generator_version": "ZEUS_RANKING_V1"
  },
  "payload": {
    "ranking": []
  }
}
```

## Contratos de auditoria

Todo artefato persistido recebe:

- `schema_version`;
- `artifact_id`;
- `artifact_type`;
- `contest`;
- `execution_id`;
- `created_at`;
- `checksum` SHA-256 do payload;
- `provenance`;
- `payload`.

A gravação usa criação exclusiva. Um `artifact_id` existente não pode ser sobrescrito silenciosamente.
