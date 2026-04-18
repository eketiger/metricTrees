# CLAUDE.md — Full Project Instructions: Metrics

> Paste this file at the root of your project. Claude Code will automatically read and follow
> these instructions in every session.

---

## Stack Overview

| # | Feature | Service |
|---|---------|---------|
| 1 | CI/CD | GitHub Actions + AWS ECS/ECR |
| 2 | Test Coverage | Jest 100% |
| 3 | GDPR | Native |
| 4 | Analytics | Mixpanel |
| 5 | Google Auth | NextAuth |
| 6 | GitHub Auth | NextAuth |
| 7 | Billing | Stripe |
| 8 | Database | PlanetScale (MySQL) + Prisma |
| 9 | AI Agents | Anthropic Claude API |
| 10 | Vector DB | Pinecone + OpenAI Embeddings |
| 11 | Product Docs + Help Center | Fumadocs |
| 12 | API Docs + API Reference | Fumadocs + Scalar |
| 13 | README | GitHub README |
| 14 | Infrastructure | AWS CDK (TypeScript) |

---

## App Description

**Metrics** is a platform for creating, visualizing, and sharing **metric trees** — hierarchical
structures that map high-level business goals down to the granular KPIs and sub-metrics that drive
them. Users (called **Builders**) construct and publish metric trees, and consumers (called
**Viewers**) explore, interrogate, and ask questions about those trees. An AI-powered **Copilot**
assists Builders while editing nodes, and a **Viewer Ask** feature lets Viewers ask natural-language
questions about any metric tree, answered using only that tree's content as context.

See the original CLAUDE.md payload in the project README and `docs/` site for the full cross-cutting
policy set (CI/CD, GDPR, Mixpanel, auth, billing, AI, vector DB, docs, infra).

All AI calls use model `claude-sonnet-4-20250514` with `max_tokens: 1024` (unless an endpoint
justifies more). `ANTHROPIC_API_KEY` is server-only — never expose to the browser.

## Model pinning

- Claude: `claude-sonnet-4-20250514`
- OpenAI embeddings: `text-embedding-3-small` (1536-dim, cosine)

## PlanetScale

- Relation mode: `prisma`
- Every FK column must have an `@@index`
- Do NOT use `prisma migrate`; use `prisma db push`
