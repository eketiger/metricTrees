<div align="center">

# Metrics

**Metrics is a platform for creating, visualizing, and sharing metric trees — hierarchical
structures that connect high-level business goals to the granular KPIs and sub-metrics that
drive them, enhanced by AI-powered design assistance and a natural-language Q&A experience.**

[![CI](https://github.com/eketiger/metrictrees/actions/workflows/ci.yml/badge.svg)](https://github.com/eketiger/metrictrees/actions/workflows/ci.yml)
[![CD](https://github.com/eketiger/metrictrees/actions/workflows/cd.yml/badge.svg)](https://github.com/eketiger/metrictrees/actions/workflows/cd.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[Live App](https://yourdomain.com) · [Docs](https://yourdomain.com/docs) · [Help Center](https://yourdomain.com/help) · [API Reference](https://yourdomain.com/api-reference)

</div>

---

## What is Metrics?

- **Builders** design, edit, and publish hierarchical metric trees. An AI-powered **Copilot**
  assists inline — suggesting child metrics, improving descriptions, generating formulas, and
  validating tree structure — all without leaving the editor.
- **Viewers** explore and interrogate published trees. The **Ask** panel answers natural-language
  questions using only the tree's content as context, powered by Claude and a RAG pipeline backed
  by a vector database.

On top of the editor: semantic search across published trees, "Similar Trees" recommendations,
Stripe-backed subscription billing, Google & GitHub OAuth, GDPR-native data rights, and Mixpanel
analytics gated behind cookie consent.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PlanetScale (MySQL) via Prisma ORM |
| Auth | NextAuth.js — Google OAuth, GitHub OAuth |
| Billing | Stripe (Checkout, Customer Portal, Webhooks) |
| AI | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| Embeddings | OpenAI `text-embedding-3-small` |
| Vector DB | Pinecone |
| Analytics | Mixpanel |
| Docs | Fumadocs |
| API Reference | Scalar |
| Styling | Tailwind + design-token CSS |
| Testing | Jest + Testing Library (100% coverage enforced) |
| CI/CD | GitHub Actions → AWS ECS (Fargate) + ECR |
| Infra | AWS CDK (TypeScript) |

---

## Project structure

```
.
├── app/                    # Next.js App Router (pages + API routes + docs/help/api-reference)
├── content/docs/           # Product + API docs (Fumadocs MDX)
├── content/help/           # Help center articles
├── lib/                    # Shared libs (anthropic, pinecone, stripe, analytics, compute…)
├── prisma/                 # schema.prisma, client, seed
├── infra/                  # AWS CDK app (8 stacks)
├── tests/                  # Jest tests
├── .github/workflows/      # ci.yml, cd.yml
├── openapi.yaml            # OpenAPI 3.1 spec
├── Dockerfile
└── CLAUDE.md
```

---

## Local development

### Prerequisites

- Node 20+
- PlanetScale DB + dev branch
- Stripe test account
- Google + GitHub OAuth apps
- Anthropic, OpenAI, Pinecone, Mixpanel accounts

### Install & run

```bash
git clone https://github.com/eketiger/metrictrees.git
cd metrictrees
npm install
cp .env.example .env.local     # fill it in
npm run db:push
npm run db:generate
npm run db:seed                # optional seed data
npm run dev
```

| Route | Description |
|---|---|
| http://localhost:3000 | Marketing / app landing |
| http://localhost:3000/signin | OAuth sign-in |
| http://localhost:3000/home | Workspace dashboard |
| http://localhost:3000/tree/&lt;id&gt; | Metric tree editor |
| http://localhost:3000/docs | Product documentation |
| http://localhost:3000/help | Help center |
| http://localhost:3000/api-reference | Interactive API reference (Scalar) |
| http://localhost:3000/openapi.yaml | Raw OpenAPI spec |

### Stripe webhooks locally

```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

---

## Tests

```bash
npm run test
npm run test -- --coverage
```

Coverage thresholds are set to 100% (branches, functions, lines, statements).

---

## Deployment

Deploys to **AWS ECS (Fargate)** on every push to `main` via GitHub Actions.

1. CI runs lint → test → build → Docker image check.
2. On merge to `main`, a new image is tagged with the commit SHA and pushed to ECR.
3. The ECS task definition is rendered with the new image URI and deployed.
4. A one-off ECS task runs `npx prisma db push`.
5. Slack notification on failure.

**Rollback:**

```bash
aws ecs update-service \
  --cluster $ECS_CLUSTER \
  --service $ECS_SERVICE \
  --task-definition $PREVIOUS_TASK_DEFINITION_ARN
```

---

## GDPR & privacy

- **Export:** `GET /api/user/data-export`
- **Delete:** `DELETE /api/user/account`
- Analytics only load after you accept the consent banner.
- Privacy policy: `/privacy`.

---

## License

MIT.
