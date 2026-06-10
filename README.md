# Sistema de Relatórios — Biblioteca

Sistema web de gestão de documentos no estilo Google Drive para uma biblioteca. Cada funcionário tem sua própria pasta pessoal e protegida para enviar e organizar relatórios, e a coordenação tem acesso de leitura a todas as pastas, podendo imprimir os relatórios em PDF. Toda a interface é em português do Brasil.

## Funcionalidades

- **Pastas pessoais protegidas** — cada funcionário acessa e gerencia apenas os seus próprios documentos.
- **Coordenação com visão geral** — a coordenadora visualiza os relatórios de todos os funcionários.
- **Impressão em PDF** — geração de PDF dos relatórios para impressão/arquivo.
- **Login por usuário e senha** — 8 funcionários + 1 coordenadora.
- **Interface 100% em português**.

## Tecnologias

- **Monorepo:** pnpm workspaces, Node.js 24, TypeScript 5.9
- **Frontend:** React + Vite
- **Backend:** Express 5
- **Banco de dados:** PostgreSQL + Drizzle ORM
- **Validação:** Zod
- **Geração de API:** Orval (a partir do OpenAPI)
- **Build:** esbuild

## Pré-requisitos

- [Node.js 24+](https://nodejs.org/)
- [pnpm](https://pnpm.io/installation) (`npm install -g pnpm`)
- [PostgreSQL](https://www.postgresql.org/download/) instalado e rodando

## Como rodar no Windows (modo fácil)

O projeto inclui dois arquivos `.cmd` que automatizam tudo:

1. **Crie o arquivo `.env`** — copie o `.env.example` para `.env` e coloque a senha do seu PostgreSQL em `DATABASE_URL`.
2. **`instalar.cmd`** — dê dois cliques **uma única vez**. Ele instala as dependências, cria as tabelas no banco e cadastra os usuários.
3. **`iniciar.cmd`** — dê dois cliques **sempre que for usar**. Ele liga os servidores e abre o navegador em http://localhost:5173 automaticamente. Para desligar, feche as duas janelas pretas.

## Como rodar manualmente (qualquer sistema)

1. **Instale as dependências:**
   ```bash
   pnpm install
   ```

2. **Configure o banco de dados** — copie `.env.example` para `.env` e ajuste a `DATABASE_URL`:
   ```
   DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/postgres
   SESSION_SECRET=uma_chave_secreta_qualquer
   ```

3. **Crie as tabelas e cadastre os usuários:**
   ```bash
   pnpm --filter @workspace/db run push
   pnpm --filter @workspace/scripts run seed
   ```

4. **Inicie a API** (em um terminal) — porta 8080:
   - PowerShell: `$env:PORT=8080; pnpm --filter @workspace/api-server run dev`
   - bash/macOS/Linux: `PORT=8080 pnpm --filter @workspace/api-server run dev`

5. **Inicie o frontend** (em outro terminal) — porta 5173:
   - PowerShell: `$env:PORT=5173; $env:BASE_PATH="/"; pnpm --filter @workspace/biblioteca run dev`
   - bash/macOS/Linux: `PORT=5173 BASE_PATH=/ pnpm --filter @workspace/biblioteca run dev`

6. **Abra** http://localhost:5173 no navegador.

## Acesso (usuários cadastrados)

**Coordenadora:**

| Usuário        | Senha       |
| -------------- | ----------- |
| `coordenadora` | `coord2024` |

**Funcionários** (senha `senha123` para todos):

`ana.silva`, `bruno.santos`, `carla.oliveira`, `daniel.costa`, `eduarda.lima`, `felipe.rodrigues`, `gabriela.ferreira`, `henrique.souza`

> Recomenda-se trocar essas senhas antes de usar em produção.

## Estrutura do projeto

```
artifacts/
  api-server/    # Backend Express (API)
  biblioteca/    # Frontend React + Vite
lib/
  api-spec/      # Especificação OpenAPI
  api-zod/       # Schemas Zod gerados
  api-client-react/  # Hooks React Query gerados
  db/            # Schema e configuração do Drizzle ORM
scripts/         # Scripts utilitários (seed, etc.)
```

## Comandos úteis

- `pnpm run typecheck` — verifica os tipos em todos os pacotes
- `pnpm run build` — typecheck + build de todos os pacotes
- `pnpm --filter @workspace/db run push` — aplica mudanças do schema no banco
- `pnpm --filter @workspace/scripts run seed` — popula o banco com os usuários
