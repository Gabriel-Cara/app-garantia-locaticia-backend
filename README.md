# Backend Órago API

Backend em Node.js + Express + TypeScript para uma plataforma com dois perfis:

- `REAL_ESTATE`: imobiliária, cria consultas PF por CPF, lista e coleta as próprias análises.
- `ADMIN`: não cria consultas, lista todas as análises feitas por todas as imobiliárias.

## Como rodar

1. Instale dependências:

```bash
npm install
```

2. Crie o `.env`:

```bash
cp .env.example .env
```

3. Edite no `.env`:

```env
HOST="127.0.0.1"
JWT_SECRET="um-segredo-grande-com-mais-de-24-caracteres"
ORAGO_BASE_URL="https://sandbox.oragoapp.com.br"
ORAGO_API_TOKEN="sua-chave-da-orago"
```

Use `https://sandbox.oragoapp.com.br` em desenvolvimento e `https://panel.oragoapp.com.br` em produção.

4. Crie o banco local e gere o Prisma Client:

```bash
npm run prisma:migrate -- --name init
```

Se o ambiente bloquear o `schema-engine` do Prisma e aparecer apenas `Schema engine error`, rode o mesmo comando no seu terminal local. O schema está em `prisma/schema.prisma`.

5. Inicie:

```bash
npm run dev
```

## Fluxo da integração

1. A sua plataforma autentica usuários com `/auth/login` e emite um JWT próprio.
2. A imobiliária chama `POST /analyses/pf` com o CPF do locatário.
3. O backend chama a Órago em `POST /api/v1/analysis/pf` usando `ORAGO_API_TOKEN`.
4. A Órago retorna `analysis_id`.
5. O backend salva esse ID no banco junto com o usuário que solicitou.
6. Quando quiser ver o resultado, a imobiliária chama `POST /analyses/:id/collect`.
7. O backend chama `POST /api/v1/analysis/collect`, salva o resultado JSON e devolve para o frontend.
8. O admin chama `GET /admin/analyses` para enxergar todas as consultas.

## Endpoints locais

### Criar usuário

```http
POST /auth/register
Content-Type: application/json

{
  "name": "Imobiliária Centro",
  "email": "imobiliaria@example.com",
  "password": "senha12345",
  "role": "REAL_ESTATE"
}
```

Para criar admin, use `"role": "ADMIN"`.

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "imobiliaria@example.com",
  "password": "senha12345"
}
```

Use o `token` retornado como `Authorization: Bearer SEU_TOKEN`.

### Criar análise PF

```http
POST /analyses/pf
Authorization: Bearer SEU_TOKEN
Content-Type: application/json

{
  "cpf": "98153314189"
}
```

Por padrão, o backend solicita:

```json
{
  "basic_data": true,
  "default_financial": true,
  "judicial": true,
  "ai": true
}
```

Você pode enviar `products` no corpo se quiser controlar quais produtos chamar.

### Minhas análises

```http
GET /analyses/mine
Authorization: Bearer SEU_TOKEN
```

### Coletar resultado

```http
POST /analyses/{id}/collect
Authorization: Bearer SEU_TOKEN
```

Use o `id` interno retornado por `POST /analyses/pf`, não o `oragoAnalysisId`.

### Admin: listar todas

```http
GET /admin/analyses?page=1&perPage=25
Authorization: Bearer TOKEN_DE_ADMIN
```

## Observações importantes

- A chave da Órago nunca deve ir para o frontend. Ela fica somente no `.env` do backend.
- O frontend usa apenas o JWT da sua plataforma.
- No ambiente real, prefira Postgres. Para isso, altere o provider no `prisma/schema.prisma` e ajuste `DATABASE_URL`.
- Webhooks da Órago podem substituir a coleta manual: quando a Órago avisar `ready-to-collect`, seu backend chama o collect e salva o resultado.
