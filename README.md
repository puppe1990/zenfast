# ZenFast

[![CI](https://github.com/puppe1990/zenfast/actions/workflows/ci.yml/badge.svg)](https://github.com/puppe1990/zenfast/actions/workflows/ci.yml)

Rastreador de jejum intermitente (PT-BR) construído com **TanStack Start + SQLite**, com o design
dark/glassmorphism gerado no Stitch (`stitch_intermittent_fasting_tracker`).

ZenFast acompanha o ciclo metabólico do jejum em tempo real: timer radial com fases biológicas
(digestão → insulina baixa → lipólise → cetose → autofagia), hidratação, disposição, protocolos,
conquistas e evolução corporal.

---

## Funcionalidades (mapeadas do design)

**Início — Timer metabólico**

- Pill do protocolo ativo (`Protocolo 16:8`, janela de jejum, início "ontem às 20:30").
- Timer radial animado com `Tempo decorrido`, `Faltam 1h 35m • Meta 12:00` e halo bioluminescente.
- Card de fase atual: badge (`Lipólise Alta`, `Cetose Ativa`, `Autofagia Ativa`…) + copy clínica.
- Stepper de estágios metabólicos (0-4h, 4-8h, 8-14h, 14-16h, 16h+) com `% do ciclo`.
- Cards de hidratação (meta segmentada + `+250ml`) e disposição (check-in de energia).
- Próxima janela de alimentação, `Encerrar Jejum Mais Cedo` (com quebra de jejum) e `Registrar Água`.

**Planos — Protocolos de jejum**

- Card do protocolo ativo com anel de adesão, fase metabólica e adesão dos últimos 30 dias.
- Catálogo 16:8 Diário (Leangains), 14:10 Suave, 18:6 Avançado, 20:4 Dieta do Guerreiro e OMAD 23:1,
  cada um com 3 biomarcadores, janela sugerida e ativação em um toque.
- Filtros (Todos / Iniciante / Intermediário / Avançado / Personalizado).
- Criador de protocolo personalizado (slider 12h-23h + início da janela).
- Dica do especialista.

**Progresso — Bio-telemetria**

- KPIs: sequência atual e recorde, horas do mês (com delta vs mês anterior), eficácia (% de metas)
  e peso total.
- Gráfico semanal de consistência (meta 16h, melhor dia, hoje) + insight de média diária.
- Composição corporal: peso inicial/atual, sparkline, progresso rumo à meta e sheet `Registrar Peso`.
- 12 conquistas com progresso parcial e 5 badges desbloqueáveis no seed de demonstração.
- Histórico recente expansível com fase atingida, pico de queima, hidratação, quebra de jejum e balanço.

**Perfil**

- Identidade, protocolo ativo, resumo (jejuns, horas, sequência) e edição de metas
  (nome, meta de água, peso inicial/meta de peso).

---

## Stack

| Camada      | Escolha                                                            |
| ----------- | ------------------------------------------------------------------ |
| Framework   | [TanStack Start](https://tanstack.com/start) (React 19, Vite, SSR) |
| Rotas dados | TanStack Router (file-based) + `createServerFn` (RPC tipado)       |
| Banco       | SQLite (`better-sqlite3`) com schema/migrações idempotentes        |
| Estilo      | Tailwind CSS v4 com os design tokens do Stitch (`@theme`)          |
| Validação   | Zod nas server functions                                           |
| Testes      | Vitest (projetos `unit` e `ui`) + Testing Library                  |
| Dados fake  | `@faker-js/faker` (seed determinístico com `--seed`)               |
| PWA         | Web manifest + service worker próprio (app shell offline)          |
| DX          | ESLint, Prettier, husky + lint-staged, GitHub Actions              |

---

## Começando

```bash
pnpm install
pnpm db:seed      # popula SQLite com ~45 dias de histórico realista (faker)
pnpm dev          # http://localhost:3000
```

O app funciona sem seed: o catálogo de protocolos e o perfil são criados automaticamente na
primeira execução. O seed é apenas para dados de demonstração.

### Scripts

| Script               | Descrição                                                |
| -------------------- | -------------------------------------------------------- |
| `pnpm dev`           | Servidor de desenvolvimento (SSR + HMR)                  |
| `pnpm build`         | Build de produção (Nitro → `.output/`)                   |
| `pnpm start`         | Roda o servidor de produção (`.output/server/index.mjs`) |
| `pnpm test`          | Suite completa (unit + ui)                               |
| `pnpm test:coverage` | Cobertura (v8, foco em `src/domain` e `src/db`)          |
| `pnpm lint`          | ESLint (flat config do TanStack com regras type-aware)   |
| `pnpm format`        | Prettier em todo o repo                                  |
| `pnpm typecheck`     | `tsc --noEmit`                                           |
| `pnpm db:seed`       | Popula o banco com dados faker (`--days`, `--seed`)      |
| `pnpm db:reset`      | Limpa e repopula o banco de demonstração                 |

### Git hooks

O `pre-commit` (husky) roda `lint-staged` (ESLint `--fix` + Prettier nos arquivos alterados) e a
suite de testes completa. O CI repete lint, formatação, typecheck, testes com cobertura e build.

---

## PWA & compartilhamento

O ZenFast é instalável e abre offline:

- **`public/manifest.webmanifest`** — nome/short_name, `display: standalone`, orientação retrato,
  cores obsidiana do design system, ícones 192/512, ícone **maskable** e atalhos para Início, Planos
  e Progresso.
- **`public/sw.js`** — service worker sem build step, com políticas por tipo de requisição:
  - navegação → **network-first** (HTML fresco) com fallback para o cache e, sem cache,
    `offline.html`;
  - assets (`style`, `script`, `font`, `image`, `manifest`) → **stale-while-revalidate**;
  - mutações e chamadas `/_serverFn` → **nunca** interceptadas (dados sempre vivos);
  - `install` pré-cacheia o shell e `activate` descarta caches de versões anteriores.
- **`public/offline.html`** — página offline autocontida (sem fontes externas), com botão de retry.
- **`src/pwa/register.ts`** — registra o worker só em produção com suporte do browser;
  `src/components/OfflineBanner.tsx` avisa quando a conexão cai.
- **Open Graph** — `public/og.png` (1200×630, gerado a partir do design) é referenciado com URL
  absoluta por `src/lib/site-meta.ts`, que também define título/descrição por rota, canonical e as
  tags `twitter:card`. O origin é lido da request no servidor (`x-forwarded-host`/proto), com
  fallback para `VITE_SITE_URL`.

Para regerar a arte social: renderize um card 1200×630 no browser com os tokens do design e
substitua `public/og.png`. Os testes `src/pwa/assets.test.ts` validam dimensões de todos os PNGs,
os campos do manifest e a página offline; `src/pwa/service-worker.test.ts` executa o `sw.js` real
com um harness de `caches`/`fetch` para checar cada estratégia.

---

## Arquitetura

```
src/
├── domain/          # regras puras (sem IO): fases, progresso, stats, metas, conquistas
├── db/              # SQLite: schema, client, repositórios, seed faker, bootstrap do catálogo
├── server/
│   ├── runtime.ts   # fronteira server-only (better-sqlite3 + repositórios + services)
│   ├── actions.ts   # server functions (createServerFn + Zod) consumidas pelas rotas
│   └── services/    # montagem das views (dashboard, progresso, protocolos, perfil)
├── pwa/             # registro do service worker e testes dos artefatos PWA
├── lib/             # site-meta: títulos por rota, canonical, Open Graph e Twitter
├── components/      # design system em React + Tailwind (tokens do Stitch)
├── routes/          # /, /planos, /progresso, /perfil (file-based)
└── test/            # setup do Testing Library

public/
├── manifest.webmanifest, sw.js, offline.html   # PWA
├── og.png (1200x630), favicon.svg, apple-touch-icon.png
└── icons/icon-192.png, icon-512.png, maskable-512.png
```

- **Domínio puro**: todas as contas (fases metabólicas, streak, eficácia, barras semanais, progresso
  de peso, conquistas) são funções puras com o `now` injetado — por isso são 100% testáveis e
  reaproveitadas no cliente para o timer ao vivo.
- **Server-only**: `runtime.ts` começa com `import '@tanstack/react-start/server-only'` e as server
  functions importam tudo por `await import('./runtime')`, então `better-sqlite3` nunca entra no
  bundle do browser.
- **Views**: os services devolvem DTOs prontos para a UI (labels em pt-BR, tones do design system),
  mantendo os componentes finos.

### Modelo de dados

`protocols`, `profiles`, `fasting_sessions`, `water_logs`, `mood_logs`, `weight_logs`,
`achievements` (por perfil) e `expert_tips`. O schema completo está em `src/db/schema.ts` e é
aplicado de forma idempotente em `createDatabase()`.

---

## Deploy

O build gera um servidor Node autocontido (Nitro):

```bash
pnpm build
pnpm start   # node .output/server/index.mjs
```

Defina `ZENFAST_DB_FILE` para apontar o arquivo SQLite (padrão: `data/zenfast.db`).

---

## Design

Os tokens (cores obsidiana/âmbar/esmeralda/violeta, tipografia Plus Jakarta Sans + JetBrains Mono,
raios e ritmo de espaçamento) vêm do `DESIGN.md` do Stitch e estão em `src/styles.css` via
`@theme` do Tailwind v4. As telas replicam os mockups de **Timer**, **Planos/Protocolos** e
**Progresso** (mais a aba **Perfil**, prevista na navegação).
