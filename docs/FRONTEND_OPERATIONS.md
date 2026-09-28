# GuildaPlay Frontend — Hardening e entrega

## Verificações locais

```bash
npm ci
npm run lint
npm test
npm run build
npm run start
npm run qa:e2e
npm run qa:visual
```

O `qa:e2e` espera o frontend em `http://localhost:3001`. Para usar outro endereço,
defina `FRONTEND_URL`. O Chrome pode ser apontado com `CHROME_PATH`.

## Ambientes

O frontend usa `API_BASE_URL` para falar com a API versionada (`/api/v1`).
Cada ambiente deve possuir sua própria URL de API; nenhum segredo da API, banco,
R2 ou pagamentos deve ser exposto em variáveis `NEXT_PUBLIC_*`.

## Observabilidade

As rotas proxy geram ou propagam `X-Request-Id`. Em respostas de erro, o ID também
é devolvido no corpo quando a falha ocorre no próprio frontend. O erro de rota exibe
o `digest` de suporte do Next.js e registra um evento estruturado no console.

## Offline e acessibilidade

O banner global informa perda de conectividade sem bloquear a navegação atual. O
cliente HTTP transforma falhas de rede em erro identificável (`NETWORK_ERROR`).
O shell público possui link de salto para o conteúdo principal e foco visível para
teclado; estados de loading, erro e 404 mantêm mensagens acessíveis.

## Deploy

O deploy esperado é Vercel/Next.js para o frontend e um serviço Node persistente
separado para a API. Configure `API_BASE_URL` no ambiente de deploy e execute as
verificações acima no pipeline antes de promover para staging ou produção.
