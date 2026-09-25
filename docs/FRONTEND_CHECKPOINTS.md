# GuildaPlay Frontend — mapa de páginas e checkpoints

## 1. Premissas

- O frontend consome somente a API NestJS em `C:\Users\cleyt\Documents\guildaPlay`.
- Nenhum sistema, item, avaliação, contagem ou estado de negócio é inventado no frontend.
- A interface pública segue o sistema visual de papel/pergaminho da referência.
- Rotas protegidas devem validar a sessão no servidor e tratar `401` e `403` da API.
- URLs de mídia assinadas são temporárias e não devem ser persistidas pelo cliente.

## 2. Situação atual

| Rota | Estado | Observação |
| --- | --- | --- |
| `/` | Pronta | Home do catálogo, busca, filtros, estados de loading/erro/vazio e integração com `GET /catalog/items` |
| `/catalogo` | Pronta | Listagem completa com busca, filtros, ordenação e paginação |
| `/api/catalog` | Pronta | Proxy server-side do Next.js para a busca pública |
| `/catalogo/[slug]` | Pronta | Detalhe editorial, capa assinada, metadata e conteúdo relacionado |
| `/catalogo/[slug]/avaliacoes` | Pronta | Avaliações públicas paginadas |
| `/listas` e `/listas/[slug]` | Prontas | Curadorias publicadas e seus títulos |
| `/colecoes/[collectionId]` | Pronta | Coleção pessoal pública |
| `/entrar` e `/cadastro` | Prontas | Login, cadastro e criação segura de sessão |
| `/verificar-email` | Pronta | Confirmação e reenvio de verificação |
| `/recuperar-senha` e `/redefinir-senha` | Prontas | Recuperação completa de credencial |
| `/conta/perfil` | Pronta | Consulta e atualização do perfil, logout geral |

Ainda não existem as páginas de biblioteca, colaboração, mestre ou administração.

## 3. Mapa geral de páginas

### Públicas — API disponível

| Rota proposta | Página | API |
| --- | --- | --- |
| `/` | Home e catálogo principal | `GET /catalog/items` |
| `/catalogo` | Listagem completa do catálogo | `GET /catalog/items` |
| `/catalogo/[slug]` | Detalhe do item | `GET /catalog/items/:slug` |
| `/catalogo/[slug]/avaliacoes` | Avaliações públicas | `GET /catalog/items/:slug/reviews` |
| `/listas` | Curadorias publicadas | `GET /catalog/lists` |
| `/listas/[slug]` | Detalhe de curadoria | `GET /catalog/lists/:slug` |
| `/colecoes/[collectionId]` | Coleção pessoal pública | `GET /catalog/collections/:collectionId` |
| `/convites/[token]` | Preview e aceite de convite | `GET /invitations/:token/preview`, `POST /invitations/:token/accept` |

Filtros como “Aventuras” e “Suplementos” devem apontar para URLs do catálogo, por exemplo
`/catalogo?type=ADVENTURE`, e não para bases locais separadas.

### Autenticação — API disponível

| Rota proposta | Página | API |
| --- | --- | --- |
| `/entrar` | Login | `POST /auth/login` |
| `/cadastro` | Cadastro de usuário | `POST /auth/register` |
| `/verificar-email` | Confirmação e reenvio | `POST /auth/verify-email`, `POST /auth/resend-verification` |
| `/recuperar-senha` | Solicitação de recuperação | `POST /auth/forgot-password` |
| `/redefinir-senha` | Nova senha por token | `POST /auth/reset-password` |

Infraestrutura associada: refresh por cookie, logout, `GET /auth/me`, proteção por role e
redirecionamento de retorno após login.

### Área pessoal — API disponível

| Rota proposta | Página | API |
| --- | --- | --- |
| `/conta/perfil` | Dados e preferências | `GET/PATCH /users/me` |
| `/biblioteca` | TENHO, QUERO, JOGUEI e FAVORITO | `GET/PUT/DELETE /catalog/me/items` |
| `/minhas-colecoes` | Coleções do usuário | `GET/POST /catalog/me/collections` |
| `/minhas-colecoes/[collectionId]` | Editar coleção e organizar itens | endpoints de coleção e itens |
| `/minhas-avaliacoes` | Avaliações próprias e status de moderação | `GET /catalog/reviews/mine` |
| `/contribuicoes` | Sugestões editoriais próprias | `GET /catalog/submissions/mine` |
| `/contribuicoes/nova` | Criar item ou sugerir alteração | `POST /catalog/submissions` |
| `/contribuicoes/[submissionId]` | Detalhe da sugestão | `GET /catalog/submissions/mine/:submissionId` |

Também entram como fluxos/modais do detalhe do item:

- adicionar/remover listas pessoais;
- avaliar ou editar avaliação;
- adicionar a uma coleção;
- denunciar item ou mídia;
- sugerir correção editorial.

### Mesas, jogador e mestre — API disponível parcialmente

| Rota proposta | Página | API/estado |
| --- | --- | --- |
| `/minhas-mesas` | Mesas das quais o jogador participa | `GET /memberships/mine` |
| `/mestre/perfil` | Criar/editar perfil de mestre | `POST/GET/PATCH /gm-profiles` |
| `/mestre/mesas` | Mesas administradas | `GET /tables/mine` |
| `/mestre/mesas/nova` | Criar mesa | `POST /tables` |
| `/mestre/mesas/[tableId]` | Visão operacional da mesa | `GET /tables/:tableId` |
| `/mestre/mesas/[tableId]/editar` | Editar, ativar, pausar e arquivar | endpoints de estado da mesa |
| `/mestre/mesas/[tableId]/membros` | Jogadores, remoção e convite | endpoints de members/invitations |

Não existe busca pública de mesas na API atual. Portanto, uma página pública de descoberta de
mesas não deve ser criada até existir contrato específico.

### Administração editorial — API disponível

| Rota proposta | Página |
| --- | --- |
| `/admin` | Visão inicial administrativa |
| `/admin/catalogo/sistemas` | Listar e criar sistemas |
| `/admin/catalogo/sistemas/[systemId]` | Editar, publicar ou arquivar sistema |
| `/admin/catalogo/itens` | Listar itens editoriais |
| `/admin/catalogo/itens/novo` | Criar item |
| `/admin/catalogo/itens/[itemId]` | Editor completo de item, relações, aliases, fontes e mídia |
| `/admin/catalogo/edicoes` | CRUD de edições |
| `/admin/catalogo/editoras` | CRUD de editoras |
| `/admin/catalogo/criadores` | CRUD de criadores |
| `/admin/catalogo/categorias` | CRUD de categorias |
| `/admin/catalogo/tags` | CRUD de tags |

### Curadoria e moderação — API disponível

| Rota proposta | Página |
| --- | --- |
| `/admin/curadorias` | Listas temáticas editoriais |
| `/admin/curadorias/[listId]` | Editar, ordenar, publicar ou arquivar lista |
| `/admin/moderacao/sugestoes` | Aprovar ou rejeitar contribuições |
| `/admin/moderacao/denuncias` | Resolver ou descartar denúncias |
| `/admin/moderacao/avaliacoes` | Publicar ou rejeitar avaliações |
| `/admin/auditoria` | Consulta de audit logs |

### Bloqueadas por ausência de API implementada

As rotas abaixo aparecem na documentação de produto, mas não possuem controller implementado no
backend atual. Não devem receber dados simulados.

| Rota futura | Dependência ausente |
| --- | --- |
| `/painel/jogador` | `GET /player/dashboard` |
| `/mestre/financeiro` | `GET /gm/dashboard` e resumos de pagamentos |
| `/mestre/conta-financeira` | endpoints de `gm-payment-account` |
| `/assinaturas` | endpoints de subscriptions |
| `/pagamentos` | histórico de payments |
| `/pagamentos/[paymentId]` | detalhe e QR Pix |
| `/admin/usuarios` | listagem administrativa de usuários |
| `/admin/contas-financeiras` | contas financeiras de mestres |
| `/admin/webhooks` | listagem, detalhe e reprocessamento |
| `/admin/reconciliacao` | reconciliação de payments/subscriptions |

Também falta um endpoint público próprio para detalhe completo de sistema. A API pública atualmente
retorna apenas `id`, `name` e `slug` do sistema dentro dos itens.

## 4. Checkpoints de implementação

### CP0 — Fundação visual e catálogo inicial — concluído

- Next.js App Router, TypeScript e ESLint;
- identidade visual baseada na referência;
- efeito de papel rasgado;
- proxy público para a API;
- busca e filtros sincronizados à URL;
- estados de carregamento, erro e catálogo vazio;
- QA desktop e mobile.

### CP1 — Catálogo público completo — concluído

Páginas:

- finalizar `/`;
- `/catalogo`;
- `/catalogo/[slug]`;
- `/catalogo/[slug]/avaliacoes`;
- `/listas` e `/listas/[slug]`;
- `/colecoes/[collectionId]`.

Critério de pronto:

- navegação não leva a rotas inexistentes;
- detalhe usa slug;
- capas usam URL assinada da API;
- SEO e metadata por item/lista;
- loading, 404 e erro padronizados;
- responsivo e sem conteúdo fictício.

### CP2 — Autenticação e sessão — concluído

Páginas:

- entrar, cadastro, verificação, recuperação e redefinição;
- menu autenticado e perfil básico.

Critério de pronto:

- access token não é persistido de forma insegura;
- refresh funciona por cookie;
- logout e logout de todas as sessões;
- retorno para a rota original após login;
- guards de `USER` e `ADMIN`.

### CP3 — Biblioteca, coleções e avaliações

Páginas:

- `/biblioteca`;
- `/minhas-colecoes` e detalhe;
- `/minhas-avaliacoes`;
- ações pessoais no detalhe do item.

Critério de pronto:

- marcadores combináveis;
- comentário privado nunca aparece em estado público;
- avaliação editada volta para `PENDING`;
- coleção pública e privada respeitam visibilidade.

### CP4 — Colaboração comunitária

Páginas/fluxos:

- criar e acompanhar sugestões;
- denunciar item/mídia;
- mensagens claras de status de moderação.

Critério de pronto:

- formulários seguem DTOs reais;
- diferenças entre CREATE_ITEM e UPDATE_ITEM;
- denúncia DUPLICATE exige item relacionado;
- status sempre vem da API.

### CP5 — Mesas sem financeiro

Páginas:

- convite público;
- minhas mesas;
- perfil do mestre;
- CRUD e estados da mesa;
- membros e convites.

Critério de pronto:

- ownership e roles tratados;
- aceite de convite trata expirado, usado e mesa cheia;
- ativar, pausar e arquivar refletem o estado real;
- nenhuma função financeira simulada.

### CP6 — Administração editorial

Páginas:

- shell `/admin`;
- sistemas, itens, edições, editoras, criadores, categorias e tags;
- upload de capa/imagens via presigned URL.

Critério de pronto:

- acesso somente `ADMIN`;
- editor de item cobre relações, aliases, fontes e mídia;
- publicar/arquivar invalida leituras públicas;
- upload ocorre direto para R2 e é confirmado na API.

### CP7 — Curadoria e moderação

Páginas:

- listas temáticas;
- filas de sugestões, denúncias e avaliações;
- auditoria.

Critério de pronto:

- decisões exigem razão quando aplicável;
- filas atualizam após decisão;
- listas aceitam somente itens publicados;
- ações administrativas exibem sucesso e falha rastreáveis.

### CP8 — Financeiro — bloqueado pelo backend

Só iniciar depois que os controllers de GM payment account, subscriptions, payments, refunds,
dashboards e webhooks administrativos estiverem implementados e validados no Swagger.

### CP9 — Hardening e entrega

- testes unitários dos formatadores e cliente HTTP;
- testes de componentes e formulários;
- E2E dos fluxos críticos;
- acessibilidade por teclado e leitor de tela;
- performance, imagens e Core Web Vitals;
- páginas de erro, `not-found`, loading e offline;
- observabilidade e identificação de `requestId` em suporte;
- documentação de deploy.

## 5. Ordem recomendada

```text
CP1 Catálogo público
  -> CP2 Autenticação
    -> CP3 Área pessoal
      -> CP4 Colaboração
        -> CP5 Mesas
          -> CP6 Administração editorial
            -> CP7 Moderação/curadoria
              -> CP8 Financeiro quando a API existir
                -> CP9 Hardening
```

O próximo checkpoint recomendado é o **CP3 — Biblioteca, coleções e avaliações**.
