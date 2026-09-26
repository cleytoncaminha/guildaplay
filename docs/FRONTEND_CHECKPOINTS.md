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
| `/catalog` | Pronta | Listagem completa com busca, filtros, ordenação e paginação |
| `/api/catalog` | Pronta | Proxy server-side do Next.js para a busca pública |
| `/catalog/[slug]` | Pronta | Detalhe editorial, capa assinada, metadata e conteúdo relacionado |
| `/catalog/[slug]/reviews` | Pronta | Avaliações públicas paginadas |
| `/lists` e `/lists/[slug]` | Prontas | Curadorias publicadas e seus títulos |
| `/collections/[collectionId]` | Pronta | Coleção pessoal pública |
| `/login` e `/register` | Prontas | Login, cadastro e criação segura de sessão |
| `/verify-email` | Pronta | Confirmação e reenvio de verificação |
| `/forgot-password` e `/reset-password` | Prontas | Recuperação completa de credencial |
| `/account/profile` | Pronta | Consulta e atualização do perfil, logout geral |
| `/library` | Pronta | Marcadores combináveis e comentários privados |
| `/my-collections` e detalhe | Prontas | CRUD, visibilidade e organização de títulos |
| `/my-reviews` | Pronta | Avaliações próprias e estados de moderação |
| `/contributions`, criação e detalhe | Prontas | Sugestões editoriais e acompanhamento da moderação |
| `/reports/new` | Pronta | Denúncias de item ou mídia com regra de duplicidade |
| `/admin` | Pronta | Shell protegido por role `ADMIN` e indicadores editoriais |
| `/admin/catalog/systems` | Pronta | CRUD, publicação e arquivamento de sistemas |
| `/admin/catalog/items` e editor | Prontas | CRUD, associações, aliases, fontes, relações e mídia |
| `/admin/catalog/editions` | Pronta | Criação e edição de edições concretas |
| Cadastros auxiliares `/admin/catalog/*` | Prontos | Editoras, criadores, categorias e tags |

A administração editorial do CP5 está implementada. Ainda faltam as páginas de curadoria e
moderação do CP6.

## 3. Mapa geral de páginas

### Públicas — API disponível

| Rota proposta | Página | API |
| --- | --- | --- |
| `/` | Home e catálogo principal | `GET /catalog/items` |
| `/catalog` | Listagem completa do catálogo | `GET /catalog/items` |
| `/catalog/[slug]` | Detalhe do item | `GET /catalog/items/:slug` |
| `/catalog/[slug]/reviews` | Avaliações públicas | `GET /catalog/items/:slug/reviews` |
| `/lists` | Curadorias publicadas | `GET /catalog/lists` |
| `/lists/[slug]` | Detalhe de curadoria | `GET /catalog/lists/:slug` |
| `/collections/[collectionId]` | Coleção pessoal pública | `GET /catalog/collections/:collectionId` |

Filtros como “Aventuras” e “Suplementos” devem apontar para URLs do catálogo, por exemplo
`/catalog?type=ADVENTURE`, e não para bases locais separadas.

### Autenticação — API disponível

| Rota proposta | Página | API |
| --- | --- | --- |
| `/login` | Login | `POST /auth/login` |
| `/register` | Cadastro de usuário | `POST /auth/register` |
| `/verify-email` | Confirmação e reenvio | `POST /auth/verify-email`, `POST /auth/resend-verification` |
| `/forgot-password` | Solicitação de recuperação | `POST /auth/forgot-password` |
| `/reset-password` | Nova senha por token | `POST /auth/reset-password` |

Infraestrutura associada: refresh por cookie, logout, `GET /auth/me`, proteção por role e
redirecionamento de retorno após login.

### Área pessoal — API disponível

| Rota proposta | Página | API |
| --- | --- | --- |
| `/account/profile` | Dados e preferências | `GET/PATCH /users/me` |
| `/library` | TENHO, QUERO, JOGUEI e FAVORITO | `GET/PUT/DELETE /catalog/me/items` |
| `/my-collections` | Coleções do usuário | `GET/POST /catalog/me/collections` |
| `/my-collections/[collectionId]` | Editar coleção e organizar itens | endpoints de coleção e itens |
| `/my-reviews` | Avaliações próprias e status de moderação | `GET /catalog/reviews/mine` |
| `/contributions` | Sugestões editoriais próprias | `GET /catalog/submissions/mine` |
| `/contributions/new` | Criar item ou sugerir alteração | `POST /catalog/submissions` |
| `/contributions/[submissionId]` | Detalhe da sugestão | `GET /catalog/submissions/mine/:submissionId` |

Também entram como fluxos/modais do detalhe do item:

- adicionar/remover listas pessoais;
- avaliar ou editar avaliação;
- adicionar a uma coleção;
- denunciar item ou mídia;
- sugerir correção editorial.

### Fora do escopo desta fase

Mesas, perfis de mestre, convites, membros e recursos financeiros ficam explicitamente adiados.
A primeira entrega do frontend cobre somente catálogo, acervo pessoal, colaboração editorial,
administração e moderação do catálogo.

### Administração editorial — API disponível

| Rota proposta | Página |
| --- | --- |
| `/admin` | Visão inicial administrativa |
| `/admin/catalog/systems` | Listar e criar sistemas |
| `/admin/catalog/systems/[systemId]` | Editar, publicar ou arquivar sistema |
| `/admin/catalog/items` | Listar itens editoriais |
| `/admin/catalog/items/new` | Criar item |
| `/admin/catalog/items/[itemId]` | Editor completo de item, relações, aliases, fontes e mídia |
| `/admin/catalog/editions` | CRUD de edições |
| `/admin/catalog/publishers` | CRUD de editoras |
| `/admin/catalog/creators` | CRUD de criadores |
| `/admin/catalog/categories` | CRUD de categorias |
| `/admin/catalog/tags` | CRUD de tags |

### Curadoria e moderação — API disponível

| Rota proposta | Página |
| --- | --- |
| `/admin/curated-lists` | Listas temáticas editoriais |
| `/admin/curated-lists/[listId]` | Editar, ordenar, publicar ou arquivar lista |
| `/admin/moderation/submissions` | Aprovar ou rejeitar contribuições |
| `/admin/moderation/reports` | Resolver ou descartar denúncias |
| `/admin/moderation/reviews` | Publicar ou rejeitar avaliações |
| `/admin/audit` | Consulta de audit logs |

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
- `/catalog`;
- `/catalog/[slug]`;
- `/catalog/[slug]/reviews`;
- `/lists` e `/lists/[slug]`;
- `/collections/[collectionId]`.

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

### CP3 — Biblioteca, coleções e avaliações — concluído

Páginas:

- `/library`;
- `/my-collections` e detalhe;
- `/my-reviews`;
- ações pessoais no detalhe do item.

Critério de pronto:

- marcadores combináveis;
- comentário privado nunca aparece em estado público;
- avaliação editada volta para `PENDING`;
- coleção pública e privada respeitam visibilidade.

### CP4 — Colaboração comunitária — concluído

Páginas/fluxos:

- criar e acompanhar sugestões;
- denunciar item/mídia;
- mensagens claras de status de moderação.

Critério de pronto:

- formulários seguem DTOs reais;
- diferenças entre CREATE_ITEM e UPDATE_ITEM;
- denúncia DUPLICATE exige item relacionado;
- status sempre vem da API.

### CP5 — Administração editorial — concluído

Entrega inicial concluída:

- shell administrativo responsivo e protegido por role `ADMIN`;
- dashboard com indicadores reais da API;
- gestão de sistemas com criação, edição, publicação e arquivamento;
- proxy server-side com renovação de sessão e validação dos corpos enviados.
- editor de itens com associações, aliases, fontes e relações;
- upload direto para R2 por URL pré-assinada e confirmação na API;
- edições, editoras, criadores, categorias e tags.

Páginas:

- shell `/admin`;
- sistemas, itens, edições, editoras, criadores, categorias e tags;
- upload de capa/imagens via presigned URL.

Critério de pronto:

- acesso somente `ADMIN`;
- editor de item cobre relações, aliases, fontes e mídia;
- publicar/arquivar invalida leituras públicas;
- upload ocorre direto para R2 e é confirmado na API.

### CP6 — Curadoria e moderação

Páginas:

- listas temáticas;
- filas de sugestões, denúncias e avaliações;
- auditoria.

Critério de pronto:

- decisões exigem razão quando aplicável;
- filas atualizam após decisão;
- listas aceitam somente itens publicados;
- ações administrativas exibem sucesso e falha rastreáveis.

### CP7 — Hardening e entrega

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
        -> CP5 Administração editorial
          -> CP6 Moderação/curadoria
            -> CP7 Hardening
```

O próximo checkpoint recomendado é o **CP6 — Curadoria e moderação**.
