"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FilePenLine,
  LoaderCircle,
  Search,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type { CatalogItem, CatalogResponse } from "./catalog-data";
import { typeLabels, typeOptions } from "./catalog-data";
import type { CatalogContribution, ContributionPayload, ContributionStatus, ContributionsResponse, ContributionType } from "@/lib/contribution-types";
import { formatDate } from "@/lib/formatters";

type Message = { type: "error" | "success"; text: string } | null;
type ContributionTarget = Pick<CatalogItem, "id" | "title" | "slug" | "type">;

const statusDetails: Record<ContributionStatus, { label: string; icon: typeof Clock3 }> = {
  PENDING: { label: "Em análise", icon: Clock3 },
  APPROVED: { label: "Aprovada", icon: CheckCircle2 },
  REJECTED: { label: "Rejeitada", icon: XCircle },
};

const experienceLabels = {
  BEGINNER: "Iniciante",
  INTERMEDIATE: "Intermediário",
  ADVANCED: "Avançado",
} as const;

const payloadLabels: Record<keyof ContributionPayload, string> = {
  title: "Título",
  slug: "Identificador",
  type: "Tipo de conteúdo",
  experienceLevel: "Nível de experiência",
  summary: "Resumo",
  description: "Descrição",
  originalReleaseYear: "Ano de lançamento",
};

async function apiRequest<T>(url: string, init?: RequestInit, unwrap = true): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  const text = response.status === 204 ? "" : await response.text();
  const body = text ? JSON.parse(text) as { data?: T; message?: string | string[] } : {};
  if (!response.ok) {
    const message = Array.isArray(body.message) ? body.message.join(" ") : body.message;
    throw Object.assign(new Error(message ?? "Não foi possível concluir a solicitação."), { status: response.status });
  }
  return (unwrap && "data" in body ? body.data : body) as T;
}

function useAuthenticatedLoad(load: () => Promise<void>) {
  const router = useRouter();
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load().catch((error: Error & { status?: number }) => {
        if (error.status === 401) {
          router.replace(`/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        }
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load, router]);
}

function StatusBadge({ status }: { status: ContributionStatus }) {
  const { label, icon: Icon } = statusDetails[status];
  return <span className={`contribution-status contribution-status--${status.toLowerCase()}`}><Icon />{label}</span>;
}

function contributionTitle(contribution: CatalogContribution) {
  return contribution.type === "CREATE_ITEM"
    ? contribution.payload.title ?? "Novo título"
    : contribution.catalogItem?.title ?? contribution.payload.title ?? "Correção editorial";
}

export function ContributionsView() {
  const [contributions, setContributions] = useState<CatalogContribution[]>([]);
  const [meta, setMeta] = useState<ContributionsResponse["meta"] | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<Message>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await apiRequest<ContributionsResponse>(`/api/me/contributions?page=${page}&limit=12`, undefined, false);
      setContributions(result.data);
      setMeta(result.meta);
    } catch (error) {
      if ((error as { status?: number }).status !== 401) {
        setMessage({ type: "error", text: error instanceof Error ? error.message : "Não foi possível carregar suas contribuições." });
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [page]);

  useAuthenticatedLoad(load);

  if (loading) return <div className="account-loading"><LoaderCircle className="spin" /> Consultando suas contribuições…</div>;

  return (
    <>
      <div className="account-toolbar contribution-toolbar">
        <div><p className="panel-eyebrow">Conhecimento compartilhado</p><h2>Suas sugestões editoriais</h2></div>
        <Link className="button-primary" href="/contributions/new"><FilePenLine /> Nova contribuição</Link>
      </div>
      {message && <p className={`form-message form-message--${message.type}`} role="alert">{message.text}</p>}
      {contributions.length ? (
        <div className="contribution-list">
          {contributions.map((contribution) => (
            <article className="contribution-card" key={contribution.id}>
              <div className="contribution-card__icon"><BookOpenCheck /></div>
              <div className="contribution-card__content">
                <header>
                  <span>{contribution.type === "CREATE_ITEM" ? "Novo título" : "Correção de título"}</span>
                  <StatusBadge status={contribution.status} />
                </header>
                <h3>{contributionTitle(contribution)}</h3>
                <p>{contribution.type === "CREATE_ITEM" ? "Proposta para ampliar o catálogo da Guilda." : `Alteração em ${contribution.catalogItem?.title ?? "um título do catálogo"}.`}</p>
                <footer><time dateTime={contribution.createdAt}>Enviada em {formatDate(contribution.createdAt)}</time><Link href={`/contributions/${contribution.id}`}>Ver detalhes <ArrowRight /></Link></footer>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state account-empty contribution-empty">
          <FilePenLine />
          <h2>Sua primeira contribuição pode começar aqui</h2>
          <p>Sugira um novo título ou ajude a aprimorar uma página existente do catálogo.</p>
          <Link className="button-primary" href="/contributions/new">Enviar sugestão</Link>
        </div>
      )}
      {meta && meta.totalPages > 1 && (
        <nav className="pagination link-pagination" aria-label="Paginação das contribuições">
          <button disabled={page <= 1} onClick={() => setPage((current) => current - 1)}><ChevronLeft /> Anterior</button>
          <span>Página {page} de {meta.totalPages}</span>
          <button disabled={page >= meta.totalPages} onClick={() => setPage((current) => current + 1)}>Próxima <ChevronRight /></button>
        </nav>
      )}
    </>
  );
}

function textValue(data: FormData, name: string) {
  const value = String(data.get(name) ?? "").trim();
  return value || undefined;
}

function nullableTextValue(data: FormData, name: string, clearName: string) {
  if (data.get(clearName) === "on") return null;
  return textValue(data, name);
}

function buildPayload(data: FormData, contributionType: ContributionType): ContributionPayload {
  const year = textValue(data, "originalReleaseYear");
  const payload: ContributionPayload = {
    title: textValue(data, "title"),
    slug: textValue(data, "slug"),
    type: textValue(data, "itemType") as CatalogItem["type"] | undefined,
    experienceLevel: data.get("clearExperienceLevel") === "on" ? null : textValue(data, "experienceLevel") as ContributionPayload["experienceLevel"],
    summary: nullableTextValue(data, "summary", "clearSummary"),
    description: nullableTextValue(data, "description", "clearDescription"),
    originalReleaseYear: data.get("clearOriginalReleaseYear") === "on" ? null : year ? Number(year) : undefined,
  };
  if (contributionType === "CREATE_ITEM") {
    delete payload.experienceLevel;
    const experienceLevel = textValue(data, "experienceLevel");
    if (experienceLevel) payload.experienceLevel = experienceLevel as NonNullable<ContributionPayload["experienceLevel"]>;
  }
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)) as ContributionPayload;
}

export function ContributionForm({ initialTarget }: { initialTarget?: ContributionTarget }) {
  const router = useRouter();
  const [contributionType, setContributionType] = useState<ContributionType>(initialTarget ? "UPDATE_ITEM" : "CREATE_ITEM");
  const [target, setTarget] = useState<ContributionTarget | null>(initialTarget ?? null);
  const [searchResults, setSearchResults] = useState<CatalogItem[]>([]);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");

  const checkSession = useCallback(async () => {
    const response = await fetch("/api/auth/session", { cache: "no-store" });
    const body = await response.json() as { data?: unknown };
    if (!response.ok || !body.data) throw Object.assign(new Error("Sessão necessária."), { status: 401 });
  }, []);
  useAuthenticatedLoad(checkSession);

  function selectType(type: ContributionType) {
    setContributionType(type);
    setMessage(null);
    if (type === "CREATE_ITEM") {
      setTarget(null);
      setSearchResults([]);
    }
    setTitle("");
    setSlug("");
  }

  async function searchCatalog() {
    const query = catalogQuery.trim();
    if (!query) return;
    setSearching(true);
    setMessage(null);
    try {
      const result = await apiRequest<CatalogResponse>(`/api/catalog?q=${encodeURIComponent(query)}&limit=8`, undefined, false);
      setSearchResults(result.data);
      if (!result.data.length) setMessage({ type: "error", text: "Nenhum título foi encontrado para essa busca." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Não foi possível pesquisar o catálogo." });
    } finally {
      setSearching(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (contributionType === "UPDATE_ITEM" && !target) {
      setMessage({ type: "error", text: "Selecione o título que deseja corrigir." });
      return;
    }
    setPending(true);
    setMessage(null);
    const data = new FormData(event.currentTarget);
    const requestBody = contributionType === "CREATE_ITEM"
      ? { type: contributionType, payload: buildPayload(data, contributionType) }
      : { type: contributionType, catalogItemId: target!.id, payload: buildPayload(data, contributionType) };
    try {
      const contribution = await apiRequest<CatalogContribution>("/api/me/contributions", { method: "POST", body: JSON.stringify(requestBody) });
      router.push(`/contributions/${contribution.id}`);
      router.refresh();
    } catch (error) {
      if ((error as { status?: number }).status === 401) {
        router.replace(`/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      } else {
        setMessage({ type: "error", text: error instanceof Error ? error.message : "Não foi possível enviar sua contribuição." });
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="contribution-form-layout">
      <aside className="contribution-guide">
        <ShieldCheck />
        <p className="panel-eyebrow">Revisão comunitária</p>
        <h2>Antes de enviar</h2>
        <p>Toda sugestão passa pela moderação antes de alterar o catálogo. Informe apenas dados que possam ser conferidos.</p>
        <ol><li>Escolha o tipo de contribuição.</li><li>Preencha os dados propostos.</li><li>Acompanhe a análise em suas contribuições.</li></ol>
      </aside>
      <form className="contribution-form" onSubmit={submit}>
        <fieldset className="contribution-kind">
          <legend>O que você deseja sugerir?</legend>
          <button className={contributionType === "CREATE_ITEM" ? "active" : ""} type="button" onClick={() => selectType("CREATE_ITEM")}><FilePenLine /><span><strong>Novo título</strong><small>Adicionar uma obra que ainda não existe.</small></span></button>
          <button className={contributionType === "UPDATE_ITEM" ? "active" : ""} type="button" onClick={() => selectType("UPDATE_ITEM")}><BookOpenCheck /><span><strong>Correção editorial</strong><small>Propor mudanças em um título publicado.</small></span></button>
        </fieldset>

        {contributionType === "UPDATE_ITEM" && (
          <section className="contribution-target">
            <h2>Título que será corrigido</h2>
            {target ? (
              <div className="selected-target"><BookOpenCheck /><span><small>{typeLabels[target.type]}</small><strong>{target.title}</strong></span><button type="button" onClick={() => setTarget(null)}>Trocar</button></div>
            ) : (
              <>
                <div className="target-search">
                  <Search />
                  <input value={catalogQuery} onChange={(event) => setCatalogQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void searchCatalog(); } }} placeholder="Busque pelo título ou sistema…" maxLength={120} />
                  <button type="button" onClick={() => void searchCatalog()} disabled={searching}>{searching ? <LoaderCircle className="spin" /> : "Buscar"}</button>
                </div>
                {!!searchResults.length && <div className="target-results">{searchResults.map((item) => <button type="button" onClick={() => { setTarget(item); setSearchResults([]); }} key={item.id}><span>{typeLabels[item.type]}</span><strong>{item.title}</strong><ArrowRight /></button>)}</div>}
              </>
            )}
          </section>
        )}

        <section className="contribution-fields">
          <header><p className="panel-eyebrow">Dados editoriais</p><h2>{contributionType === "CREATE_ITEM" ? "Apresente o novo título" : "Informe somente o que deve mudar"}</h2></header>
          <div className="contribution-field-grid">
            <label>Título<input name="title" value={title} onChange={(event) => { setTitle(event.target.value); if (contributionType === "CREATE_ITEM") setSlug(event.target.value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")); }} required={contributionType === "CREATE_ITEM"} maxLength={255} placeholder={contributionType === "UPDATE_ITEM" ? "Deixe vazio para não alterar" : "Nome oficial da obra"} /></label>
            <label>Identificador da URL<input name="slug" value={slug} onChange={(event) => setSlug(event.target.value)} required={contributionType === "CREATE_ITEM"} maxLength={280} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="nome-do-titulo" /></label>
            <label>Tipo de conteúdo<select name="itemType" required={contributionType === "CREATE_ITEM"} defaultValue=""><option value="">{contributionType === "CREATE_ITEM" ? "Selecione" : "Não alterar"}</option>{typeOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
            <label>Nível de experiência<select name="experienceLevel" defaultValue=""><option value="">{contributionType === "CREATE_ITEM" ? "Não informado" : "Não alterar"}</option><option value="BEGINNER">Iniciante</option><option value="INTERMEDIATE">Intermediário</option><option value="ADVANCED">Avançado</option></select>{contributionType === "UPDATE_ITEM" && <span className="clear-field"><input type="checkbox" name="clearExperienceLevel" /> Remover informação atual</span>}</label>
            <label>Ano de lançamento<input name="originalReleaseYear" type="number" min="1900" max="2200" placeholder={contributionType === "UPDATE_ITEM" ? "Não alterar" : "Ex.: 2024"} />{contributionType === "UPDATE_ITEM" && <span className="clear-field"><input type="checkbox" name="clearOriginalReleaseYear" /> Remover informação atual</span>}</label>
          </div>
          <label>Resumo<textarea name="summary" maxLength={1000} placeholder={contributionType === "UPDATE_ITEM" ? "Escreva apenas se deseja substituir o resumo" : "Uma apresentação breve da obra"} />{contributionType === "UPDATE_ITEM" && <span className="clear-field"><input type="checkbox" name="clearSummary" /> Remover resumo atual</span>}</label>
          <label>Descrição editorial<textarea className="contribution-description" name="description" maxLength={20000} placeholder={contributionType === "UPDATE_ITEM" ? "Escreva apenas se deseja substituir a descrição" : "Detalhes, proposta e contexto da obra"} />{contributionType === "UPDATE_ITEM" && <span className="clear-field"><input type="checkbox" name="clearDescription" /> Remover descrição atual</span>}</label>
        </section>
        {message && <p className={`form-message form-message--${message.type}`} role="alert">{message.text}</p>}
        <footer className="contribution-submit"><Link href="/contributions">Cancelar</Link><button className="button-primary" type="submit" disabled={pending}>{pending ? <><LoaderCircle className="spin" /> Enviando…</> : <><Send /> Enviar para análise</>}</button></footer>
      </form>
    </div>
  );
}

function displayPayloadValue(key: keyof ContributionPayload, value: ContributionPayload[keyof ContributionPayload]) {
  if (value === null) return "Remover informação atual";
  if (key === "type" && typeof value === "string") return typeLabels[value as CatalogItem["type"]];
  if (key === "experienceLevel" && typeof value === "string") return experienceLabels[value as keyof typeof experienceLabels];
  return String(value);
}

export function ContributionDetailView({ contributionId }: { contributionId: string }) {
  const [contribution, setContribution] = useState<CatalogContribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<Message>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setContribution(await apiRequest<CatalogContribution>(`/api/me/contributions/${contributionId}`));
    } catch (error) {
      if ((error as { status?: number }).status !== 401) setMessage({ type: "error", text: error instanceof Error ? error.message : "Não foi possível carregar a contribuição." });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [contributionId]);
  useAuthenticatedLoad(load);

  if (loading) return <div className="account-loading"><LoaderCircle className="spin" /> Consultando a proposta…</div>;
  if (!contribution) return <div className="empty-state account-empty"><FilePenLine /><h2>Contribuição indisponível</h2>{message && <p>{message.text}</p>}<Link className="button-secondary" href="/contributions">Voltar às contribuições</Link></div>;

  const fields = Object.entries(contribution.payload) as [keyof ContributionPayload, ContributionPayload[keyof ContributionPayload]][];
  return (
    <article className="contribution-detail">
      <header className="contribution-detail__header">
        <div><p className="panel-eyebrow">{contribution.type === "CREATE_ITEM" ? "Proposta de novo título" : "Proposta de correção"}</p><h1>{contributionTitle(contribution)}</h1><p>Enviada em {formatDate(contribution.createdAt)}</p></div>
        <StatusBadge status={contribution.status} />
      </header>
      {contribution.catalogItem && <section className="contribution-target-card"><div><small>Título relacionado</small><h2>{contribution.catalogItem.title}</h2><span>{typeLabels[contribution.catalogItem.type]}</span></div><Link href={`/catalog/${contribution.catalogItem.slug}`}>Abrir catálogo <ArrowRight /></Link></section>}
      <section className="contribution-payload"><header><FilePenLine /><div><p className="panel-eyebrow">Conteúdo enviado</p><h2>Dados propostos</h2></div></header><dl>{fields.map(([key, value]) => <div key={key}><dt>{payloadLabels[key]}</dt><dd>{displayPayloadValue(key, value)}</dd></div>)}</dl></section>
      <section className={`moderation-result moderation-result--${contribution.status.toLowerCase()}`}>
        <ShieldCheck />
        <div><p className="panel-eyebrow">Moderação da Guilda</p><h2>{contribution.status === "PENDING" ? "Sua contribuição está na fila de análise" : contribution.status === "APPROVED" ? "Contribuição aprovada" : "Contribuição não aprovada"}</h2><p>{contribution.reviewReason ?? (contribution.status === "PENDING" ? "Assim que a equipe concluir a revisão, o resultado aparecerá aqui." : "A moderação não deixou uma observação adicional.")}</p>{contribution.reviewedAt && <time dateTime={contribution.reviewedAt}>Revisada em {formatDate(contribution.reviewedAt)}</time>}</div>
      </section>
      <footer className="contribution-detail__footer"><Link className="button-secondary" href="/contributions"><ChevronLeft /> Todas as contribuições</Link><Link className="button-primary" href="/contributions/new">Enviar outra sugestão</Link></footer>
    </article>
  );
}
