# Doculoc API

API backend para gerenciamento de análises cadastrais de locação, controle de créditos de consultas, contestação de análises, aprovação manual por administrador e geração de contratos a partir de template `.docx`.

---

## Tecnologias

* Node.js
* Express
* TypeScript
* Prisma ORM
* SQLite
* JWT
* Zod
* Docxtemplater
* PizZip
* Integração com API Órago

---

## Visão geral do fluxo

O sistema possui dois perfis principais:

* `ADMIN`
* `REAL_ESTATE`

A imobiliária realiza consultas de CPF ou CNPJ. O backend consulta a API da Órago, processa a resposta, avalia a recomendação e cria uma `RentalApplication`.

Fluxo principal:

```txt
Imobiliária consulta CPF ou CNPJ
  ↓
Backend consulta API Órago
  ↓
Backend avalia se é recomendado ou não
  ↓
Se aprovado:
  status = WAITING_CONTRACT_DATA
  ↓
Imobiliária preenche dados do locatário e imóvel
  ↓
status = WAITING_ADMIN_CONTRACT
  ↓
Admin gera contrato DOCX
  ↓
status = CONTRACT_GENERATED

Se reprovado:
  status = REJECTED
  ↓
Imobiliária pode contestar
  ↓
status = CONTESTED
  ↓
Admin pode aprovar ou reprovar manualmente
```

---

## Perfis de usuário

### ADMIN

Pode:

* Ver todas as consultas
* Aprovar ou reprovar consultas manualmente
* Gerar contratos
* Baixar contratos
* Gerenciar créditos das imobiliárias
* Definir imobiliária como VIP
* Consultar ledger de créditos

### REAL_ESTATE

Pode:

* Fazer consulta por CPF
* Fazer consulta por CNPJ
* Ver suas próprias consultas
* Contestar consulta reprovada
* Preencher dados de contrato quando a consulta for aprovada
* Baixar contrato gerado de suas próprias consultas

---

## Controle de créditos

Ao cadastrar um usuário `REAL_ESTATE`, o sistema cria automaticamente uma carteira de créditos com:

```txt
availableCredits = 3
isVip = false
```

Regras:

```txt
Usuário comum:
  cada consulta consome 1 crédito

Usuário VIP:
  consultas infinitas
  consultas não descontam crédito

Somente ADMIN:
  pode alterar créditos
  pode ativar/desativar VIP
```

---

## Status da consulta

A entidade principal do fluxo é `RentalApplication`.

Possíveis status:

```txt
CONSULTED
WAITING_CONTRACT_DATA
WAITING_ADMIN_CONTRACT
CONTRACT_GENERATED
REJECTED
CONTESTED
ADMIN_REJECTED
CANCELLED
```

### Significado

| Status                   | Descrição                                                     |
| ------------------------ | ------------------------------------------------------------- |
| `CONSULTED`              | Consulta criada, mas sem fluxo avançado concluído             |
| `WAITING_CONTRACT_DATA`  | Consulta aprovada e aguardando dados do locatário/imóvel      |
| `WAITING_ADMIN_CONTRACT` | Dados preenchidos e aguardando geração do contrato pelo admin |
| `CONTRACT_GENERATED`     | Contrato gerado com sucesso                                   |
| `REJECTED`               | Consulta reprovada automaticamente                            |
| `CONTESTED`              | Consulta reprovada foi contestada pela imobiliária            |
| `ADMIN_REJECTED`         | Admin reprovou manualmente                                    |
| `CANCELLED`              | Consulta cancelada                                            |

---

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
NODE_ENV=development
PORT=3333
HOST=127.0.0.1

DATABASE_URL="file:./dev.db"

JWT_SECRET="sua_chave_jwt_com_no_minimo_24_caracteres"

ORAGO_BASE_URL="https://api.orago.com.br"
ORAGO_API_TOKEN="seu_token_orago"

CONTRACT_TEMPLATE_PATH="src/templates/default-rental-contract.docx"
CONTRACT_OUTPUT_DIR="storage/contracts"
```

---

## Instalação

```bash
npm install
```

Gerar Prisma Client:

```bash
npx prisma generate
```

Rodar migrations:

```bash
npx prisma migrate dev
```

Rodar em desenvolvimento:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Produção:

```bash
npm start
```

---

## Scripts úteis

```json
{
  "dev": "tsx watch src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "postinstall": "prisma generate",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev",
  "prisma:studio": "prisma studio"
}
```

---

## Autenticação

A API usa JWT.

Após login, envie o token no header:

```http
Authorization: Bearer TOKEN
```

---

# Rotas

## Auth

---

## Criar usuário

```http
POST /auth/register
```

### Body ADMIN

```json
{
  "name": "Admin Doculoc",
  "email": "admin@doculoc.com",
  "password": "12345678",
  "role": "ADMIN"
}
```

### Body REAL_ESTATE

```json
{
  "email": "imobiliaria@teste.com",
  "password": "12345678",
  "role": "REAL_ESTATE",
  "realEstateProfile": {
    "name": "Imobiliária Teste",
    "cnpj": "00643404000101",
    "phone": "11999999999",
    "responsibleName": "Maria Silva"
  }
}
```

Para usuários `REAL_ESTATE`, o campo `cnpj` é opcional. O `name` do usuário é preenchido com `responsibleName`; o nome da imobiliária fica em `realEstateProfile.name`.

### Response

```json
{
  "user": {
    "id": "uuid",
    "name": "Maria Silva",
    "email": "imobiliaria@teste.com",
    "role": "REAL_ESTATE",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "realEstateProfile": {
      "id": "uuid",
      "name": "Imobiliária Teste",
      "cnpj": "00643404000101",
      "phone": "11999999999",
      "responsibleName": "Maria Silva",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  }
}
```

Quando o usuário criado for `REAL_ESTATE`, o backend cria automaticamente uma carteira com 3 consultas gratuitas.

---

## Login

```http
POST /auth/login
```

### Body

```json
{
  "email": "imobiliaria@teste.com",
  "password": "12345678"
}
```

### Response

```json
{
  "token": "jwt-token",
  "user": {
    "id": "uuid",
    "name": "Maria Silva",
    "email": "imobiliaria@teste.com",
    "role": "REAL_ESTATE",
    "realEstateProfile": {
      "id": "uuid",
      "name": "Imobiliária Teste",
      "cnpj": "00643404000101",
      "phone": "11999999999",
      "responsibleName": "Maria Silva",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  }
}
```

---

# Rental Applications

---

## Criar consulta CPF

Permissão:

```txt
REAL_ESTATE
```

```http
POST /rental-applications/cpf
Authorization: Bearer TOKEN
```

### Body

```json
{
  "cpf": "12345678909",
  "rentValue": 1200,
  "condominiumValue": 300,
  "feesValue": 150
}
```

### Response aprovada

```json
{
  "application": {
    "id": "uuid",
    "documentType": "CPF",
    "document": "12345678909",
    "requesterId": "uuid",
    "rentValue": "1200",
    "condominiumValue": "300",
    "feesValue": "150",
    "requestedExpense": "1650",
    "automaticDecision": "APPROVED",
    "recommendation": "RECOMMENDED",
    "status": "WAITING_CONTRACT_DATA",
    "housingExpenseMin": "1000",
    "housingExpenseMax": "2500",
    "decisionReasons": "[...]",
    "decisionMetadata": null,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  },
  "decision": {
    "status": "approved",
    "recommendation": "recommended",
    "requestedExpense": 1650,
    "housingExpense": {
      "min": 1000,
      "max": 2500,
      "raw": "..."
    },
    "reasons": [
      "Análise recomendada e despesa dentro do limite permitido"
    ]
  }
}
```

### Response reprovada

```json
{
  "application": {
    "id": "uuid",
    "documentType": "CPF",
    "document": "12345678909",
    "automaticDecision": "REJECTED",
    "recommendation": "NOT_RECOMMENDED",
    "status": "REJECTED"
  },
  "decision": {
    "status": "rejected",
    "recommendation": "not_recommended",
    "requestedExpense": 1650,
    "housingExpense": {
      "min": 423.6,
      "max": 847.2,
      "raw": "..."
    },
    "reasons": [
      "Score de crédito baixo",
      "Probabilidade de inadimplência alta"
    ]
  }
}
```

---

## Criar consulta CNPJ

Permissão:

```txt
REAL_ESTATE
```

```http
POST /rental-applications/cnpj
Authorization: Bearer TOKEN
```

### Body

```json
{
  "cnpj": "00643404000101",
  "rentValue": 1500,
  "condominiumValue": 400,
  "feesValue": 200
}
```

### Response aprovada

```json
{
  "application": {
    "id": "uuid",
    "documentType": "CNPJ",
    "document": "00643404000101",
    "requesterId": "uuid",
    "rentValue": "1500",
    "condominiumValue": "400",
    "feesValue": "200",
    "requestedExpense": "2100",
    "automaticDecision": "APPROVED",
    "recommendation": "RECOMMENDED",
    "status": "WAITING_CONTRACT_DATA"
  },
  "decision": {
    "status": "approved",
    "recommendation": "recommended",
    "requestedExpense": 2100,
    "housingExpense": {
      "min": 1881.24,
      "max": 2821.86,
      "raw": "Faturamento presumido anual: 225749. Percentual aplicado: 15%"
    },
    "reasons": [
      "Empresa ativa, sem negativações, sem dívidas/protestos relevantes, risco de inadimplência aceitável e despesa dentro da capacidade estimada"
    ],
    "metadata": {
      "companyStatus": "ATIVA",
      "creditScore": 439,
      "defaultProbability": 7.31,
      "financialRiskLevel": 2,
      "judicialRiskLevel": 1,
      "companyRiskLevel": 1
    }
  }
}
```

---

## Listar consultas

Permissão:

```txt
ADMIN
REAL_ESTATE
```

```http
GET /rental-applications
Authorization: Bearer TOKEN
```

### Query params opcionais

```txt
status
document
requesterId
page
perPage
```

Exemplo:

```http
GET /rental-applications?status=WAITING_ADMIN_CONTRACT&page=1&perPage=25
```

### Response

```json
{
  "applications": [
    {
      "id": "uuid",
      "documentType": "CPF",
      "document": "12345678909",
      "status": "WAITING_CONTRACT_DATA",
      "automaticDecision": "APPROVED",
      "recommendation": "RECOMMENDED",
      "decisionReasons": [
        "Análise recomendada e despesa dentro do limite permitido"
      ],
      "decisionMetadata": null,
      "requester": {
        "id": "uuid",
        "name": "Maria Silva",
        "email": "imobiliaria@teste.com",
        "realEstateProfile": {
          "id": "uuid",
          "name": "Imobiliária Teste",
          "cnpj": "00643404000101",
          "phone": "11999999999",
          "responsibleName": "Maria Silva"
        }
      },
      "contract": null,
      "contests": []
    }
  ],
  "meta": {
    "page": 1,
    "perPage": 25,
    "total": 1,
    "lastPage": 1
  }
}
```

Observação:

* `ADMIN` visualiza todas as consultas.
* `REAL_ESTATE` visualiza somente suas próprias consultas.

---

## Buscar consulta por ID

Permissão:

```txt
ADMIN
REAL_ESTATE dono da consulta
```

```http
GET /rental-applications/:id
Authorization: Bearer TOKEN
```

### Response

```json
{
  "application": {
    "id": "uuid",
    "documentType": "CPF",
    "document": "12345678909",
    "status": "WAITING_CONTRACT_DATA",
    "automaticDecision": "APPROVED",
    "recommendation": "RECOMMENDED",
    "decisionReasons": [
      "Análise recomendada e despesa dentro do limite permitido"
    ],
    "decisionMetadata": null,
    "contract": null,
    "contests": []
  }
}
```

---

## Preencher dados para contrato

Permissão:

```txt
REAL_ESTATE dono da consulta
```

A consulta precisa estar com status:

```txt
WAITING_CONTRACT_DATA
```

```http
PATCH /rental-applications/:id/contract-data
Authorization: Bearer TOKEN
```

### Body

```json
{
  "tenantName": "Fulano da Silva",
  "tenantDocument": "12345678909",
  "tenantEmail": "fulano@email.com",
  "tenantPhone": "11999999999",
  "propertyZipCode": "01001000",
  "propertyStreet": "Praça da Sé",
  "propertyNumber": "100",
  "propertyComplement": "Apartamento 12",
  "propertyNeighborhood": "Sé",
  "propertyCity": "São Paulo",
  "propertyState": "SP"
}
```

### Response

```json
{
  "application": {
    "id": "uuid",
    "tenantName": "Fulano da Silva",
    "tenantDocument": "12345678909",
    "tenantEmail": "fulano@email.com",
    "tenantPhone": "11999999999",
    "propertyZipCode": "01001000",
    "propertyStreet": "Praça da Sé",
    "propertyNumber": "100",
    "propertyComplement": "Apartamento 12",
    "propertyNeighborhood": "Sé",
    "propertyCity": "São Paulo",
    "propertyState": "SP",
    "status": "WAITING_ADMIN_CONTRACT"
  }
}
```

Ao preencher esses dados, o sistema cria ou atualiza um contrato com:

```txt
status = PENDING
```

---

## Contestar consulta

Permissão:

```txt
REAL_ESTATE dono da consulta
```

A consulta precisa estar com status:

```txt
REJECTED
```

```http
POST /rental-applications/:id/contest
Authorization: Bearer TOKEN
```

### Body

```json
{
  "reason": "Cliente apresentou documentação complementar, comprovante de renda atualizado e fiador adicional."
}
```

### Response

```json
{
  "contest": {
    "id": "uuid",
    "applicationId": "uuid",
    "createdById": "uuid",
    "reason": "Cliente apresentou documentação complementar, comprovante de renda atualizado e fiador adicional.",
    "status": "OPEN",
    "reviewedById": null,
    "reviewedAt": null,
    "adminNote": null,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

Após contestar:

```txt
RentalApplication.status = CONTESTED
```

---

## Decisão manual do admin

Permissão:

```txt
ADMIN
```

```http
PATCH /rental-applications/:id/admin-decision
Authorization: Bearer TOKEN
```

### Aprovar manualmente

```json
{
  "decision": "APPROVED",
  "reason": "Aprovado manualmente após análise dos documentos complementares."
}
```

### Response

```json
{
  "application": {
    "id": "uuid",
    "status": "WAITING_CONTRACT_DATA",
    "adminDecision": "APPROVED",
    "adminDecisionById": "uuid",
    "adminDecisionReason": "Aprovado manualmente após análise dos documentos complementares.",
    "adminDecisionAt": "2026-01-01T00:00:00.000Z"
  }
}
```

Se houver contestação aberta, ela será marcada como:

```txt
ACCEPTED
```

### Reprovar manualmente

```json
{
  "decision": "REJECTED",
  "reason": "Documentação complementar insuficiente para aprovação."
}
```

### Response

```json
{
  "application": {
    "id": "uuid",
    "status": "ADMIN_REJECTED",
    "adminDecision": "REJECTED",
    "adminDecisionById": "uuid",
    "adminDecisionReason": "Documentação complementar insuficiente para aprovação.",
    "adminDecisionAt": "2026-01-01T00:00:00.000Z"
  }
}
```

Se houver contestação aberta, ela será marcada como:

```txt
REJECTED
```

---

# Contracts

---

## Gerar contrato

Permissão:

```txt
ADMIN
```

A consulta precisa estar com status:

```txt
WAITING_ADMIN_CONTRACT
```

```http
POST /contracts/applications/:applicationId/generate
Authorization: Bearer TOKEN
```

### Body

Não precisa body.

### Response

```json
{
  "contract": {
    "id": "uuid",
    "applicationId": "uuid",
    "status": "GENERATED",
    "templateName": "default-rental-contract.docx",
    "filePath": "storage/contracts/contrato-uuid.docx",
    "fileName": "contrato-uuid.docx",
    "generatedById": "uuid",
    "generatedAt": "2026-01-01T00:00:00.000Z",
    "errorMessage": null,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

Após gerar:

```txt
RentalApplication.status = CONTRACT_GENERATED
Contract.status = GENERATED
```

---

## Baixar contrato

Permissão:

```txt
ADMIN
REAL_ESTATE dono da consulta
```

```http
GET /contracts/:id/download
Authorization: Bearer TOKEN
```

### Response

Retorna o arquivo `.docx`.

Headers esperados:

```http
Content-Disposition: attachment; filename="contrato-uuid.docx"
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

---

# Créditos

---

## Consultar wallet

Permissão:

```txt
ADMIN
```

```http
GET /credits/users/:userId/wallet
Authorization: Bearer TOKEN
```

### Response

```json
{
  "wallet": {
    "id": "uuid",
    "userId": "uuid",
    "availableCredits": 3,
    "isVip": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

---

## Definir créditos

Permissão:

```txt
ADMIN
```

```http
PATCH /credits/users/:userId/credits
Authorization: Bearer TOKEN
```

### Body

```json
{
  "credits": 10,
  "reason": "Créditos adicionados manualmente pelo admin."
}
```

### Response

```json
{
  "wallet": {
    "id": "uuid",
    "userId": "uuid",
    "availableCredits": 10,
    "isVip": false,
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

---

## Ativar ou desativar VIP

Permissão:

```txt
ADMIN
```

```http
PATCH /credits/users/:userId/vip
Authorization: Bearer TOKEN
```

### Body

```json
{
  "isVip": true,
  "reason": "Usuário definido como VIP."
}
```

### Response

```json
{
  "wallet": {
    "id": "uuid",
    "userId": "uuid",
    "availableCredits": 10,
    "isVip": true,
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

---

## Consultar histórico de créditos

Permissão:

```txt
ADMIN
```

```http
GET /credits/users/:userId/ledger
Authorization: Bearer TOKEN
```

### Response

```json
{
  "ledger": [
    {
      "id": "uuid",
      "userId": "uuid",
      "actorId": "uuid-do-admin",
      "type": "ADMIN_SET",
      "amount": 10,
      "balanceAfter": 10,
      "reason": "Créditos adicionados manualmente pelo admin.",
      "createdAt": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": "uuid",
      "userId": "uuid",
      "actorId": null,
      "type": "INITIAL_GRANT",
      "amount": 3,
      "balanceAfter": 3,
      "reason": "Créditos gratuitos iniciais no cadastro",
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

---

# Template DOCX

O sistema gera contratos a partir de um arquivo `.docx` configurado em:

```env
CONTRACT_TEMPLATE_PATH="src/templates/default-rental-contract.docx"
```

O arquivo deve conter placeholders compatíveis com `docxtemplater`.

## Variáveis disponíveis

```txt
{tenantName}
{tenantDocument}
{tenantEmail}
{tenantPhone}

{propertyZipCode}
{propertyStreet}
{propertyNumber}
{propertyComplement}
{propertyNeighborhood}
{propertyCity}
{propertyState}

{rentValue}
{condominiumValue}
{feesValue}
{requestedExpense}

{packageValue}
{feeValue}
{monthlyServiceFee}

{realEstateName}
{realEstateEmail}
{realEstateCnpj}
{realEstatePhone}
{realEstateResponsibleName}

{generatedAt}
```

## Significado das principais variáveis

| Variável                 | Descrição                                 |
| ------------------------ | ----------------------------------------- |
| `{tenantName}`           | Nome do locatário                         |
| `{tenantDocument}`       | CPF ou CNPJ do locatário                  |
| `{tenantEmail}`          | E-mail do locatário                       |
| `{tenantPhone}`          | Telefone do locatário                     |
| `{propertyZipCode}`      | CEP do imóvel                             |
| `{propertyStreet}`       | Rua ou avenida do imóvel                  |
| `{propertyNumber}`       | Número do imóvel                          |
| `{propertyComplement}`   | Complemento do imóvel                     |
| `{propertyNeighborhood}` | Bairro do imóvel                          |
| `{propertyCity}`         | Cidade do imóvel                          |
| `{propertyState}`        | Estado do imóvel                          |
| `{rentValue}`            | Valor do aluguel                          |
| `{condominiumValue}`     | Valor do condomínio                       |
| `{feesValue}`            | Valor das taxas                           |
| `{requestedExpense}`     | Soma do aluguel, condomínio e taxas       |
| `{packageValue}`         | Valor total do pacote                     |
| `{feeValue}`             | Valor da taxa preenchida pela imobiliária |
| `{monthlyServiceFee}`    | Taxa de serviço mensal calculada          |
| `{realEstateName}`       | Nome da imobiliária                       |
| `{realEstateEmail}`      | E-mail da imobiliária                     |
| `{realEstateCnpj}`       | CNPJ da imobiliária                       |
| `{realEstatePhone}`      | Telefone da imobiliária                   |
| `{realEstateResponsibleName}` | Nome do responsável da imobiliária   |
| `{generatedAt}`          | Data de geração do contrato               |

---

# Regras de decisão automática

## Pessoa Física

A avaliação de CPF considera, entre outros pontos:

```txt
Situação do CPF
Biometria
Score de crédito
Probabilidade de inadimplência
Dívidas
Protestos
Processos judiciais
Renda presumida
Capacidade de pagamento do pacote locatício
```

## Pessoa Jurídica

A avaliação de CNPJ considera, entre outros pontos:

```txt
Status da empresa
Score PJ
Probabilidade de inadimplência
Negativações
Dívidas
Protestos
Risco judicial
Faturamento presumido
Capacidade de pagamento do pacote locatício
```

Para PJ, a capacidade é calculada com base no faturamento presumido anual convertido em faturamento mensal estimado.

---

# Exemplos de erros

## Token ausente ou inválido

```json
{
  "message": "Token inválido"
}
```

Status:

```txt
401
```

---

## Acesso negado

```json
{
  "message": "Acesso negado"
}
```

Status:

```txt
403
```

---

## Usuário sem créditos

```json
{
  "message": "Usuário sem consultas disponíveis"
}
```

Status:

```txt
402
```

---

## Consulta não encontrada

```json
{
  "message": "Consulta não encontrada"
}
```

Status:

```txt
404
```

---

## Consulta não liberada para contrato

```json
{
  "message": "Essa consulta ainda não está liberada para preenchimento dos dados do contrato"
}
```

Status:

```txt
400
```

---

## Consulta não pronta para geração de contrato

```json
{
  "message": "Essa consulta ainda não está pronta para geração de contrato"
}
```

Status:

```txt
400
```

---

# Checklist de testes

Fluxos principais:

```txt
1. Criar admin
2. Login admin
3. Criar imobiliária
4. Login imobiliária
5. Validar wallet inicial com 3 créditos
6. Criar consulta CPF
7. Criar consulta CNPJ
8. Validar consumo de 1 crédito por consulta
9. Validar consulta aprovada com status WAITING_CONTRACT_DATA
10. Preencher dados do contrato
11. Validar status WAITING_ADMIN_CONTRACT
12. Admin gerar contrato
13. Validar status CONTRACT_GENERATED
14. Baixar contrato
15. Criar consulta reprovada
16. Contestar consulta
17. Admin aprovar contestação
18. Preencher dados do contrato após aprovação manual
19. Gerar contrato após aprovação manual
20. Testar alteração de créditos
21. Testar VIP
22. Testar permissões negadas
```

---

# Segurança e boas práticas

Não versionar:

```txt
.env
node_modules
dist
prisma/*.db
prisma/*.db-journal
storage/contracts/*.docx
```

Sugestão de `.gitignore`:

```gitignore
node_modules
dist
.env
*.log

prisma/*.db
prisma/*.db-journal

storage/contracts/*
!storage/contracts/.gitkeep
```

---

# Estrutura recomendada de diretórios

```txt
src/
  config/
    env.ts

  controllers/
    auth.controller.ts
    rental-application.controller.ts
    credit.controller.ts
    contract.controller.ts

  domain/
    roles.ts

  lib/
    prisma.ts

  middlewares/
    auth.ts
    async-handler.ts
    error-handler.ts

  routes/
    auth.routes.ts
    rental-application.routes.ts
    credit.routes.ts
    contract.routes.ts
    system.routes.ts
    index.routes.ts

  schemas/
    auth.schemas.ts
    document.schemas.ts
    rental-application.schemas.ts
    credit.schemas.ts

  services/
    orago-client.ts
    rental-application.service.ts
    credit.service.ts
    contract.service.ts

  templates/
    default-rental-contract.docx

  utils/
    evaluate-tenant.ts
    evaluate-pf-tenant.ts
    evaluate-pj-tenant.ts
    parse-number.ts
    parse-percentage.ts
    parse-brazilian-currency.ts
    parse-currency-range.ts
```

---

# Observações finais

Este backend centraliza a regra de negócio no servidor.

O frontend deve apenas:

```txt
1. Enviar dados da consulta
2. Exibir resultado da análise
3. Permitir contestação quando reprovado
4. Permitir preenchimento de contrato quando aprovado
5. Permitir download do contrato quando gerado
```

A decisão de aprovação, reprovação, consumo de crédito, contestação, aprovação manual e geração do contrato devem permanecer no backend.
