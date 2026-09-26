"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Archive, CheckCircle2, ChevronLeft, ChevronRight, Edit3, ExternalLink, LoaderCircle, Plus, Save, Search, Send, X } from "lucide-react";
import type { ApiFailure } from "@/lib/auth-types";
import type { Paginated, Publisher, RpgSystem, RpgSystemInput } from "@/lib/admin-types";

type Editor = { mode: "create" } | { mode: "edit"; system: RpgSystem };
type Notice = { type: "success" | "error"; text: string } | null;

const statusLabels = { DRAFT: "Rascunho", PUBLISHED: "Publicado", ARCHIVED: "Arquivado" } as const;

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function responseBody<T>(response: Response) {
  const body = await response.json() as { data: T } & ApiFailure;
  if (!response.ok) {
    const message = Array.isArray(body.message) ? body.message.join(" ") : body.message;
    throw new Error(message ?? "Não foi possível concluir a operação.");
  }
  return body.data;
}

function SystemEditor({ editor, publishers, onClose, onSaved }: { editor: Editor; publishers: Publisher[]; onClose: () => void; onSaved: (system: RpgSystem, created: boolean) => void }) {
  const current = editor.mode === "edit" ? editor.system : null;
  const [name, setName] = useState(current?.name ?? "");
  const [slug, setSlug] = useState(current?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(editor.mode === "edit");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const values = new FormData(event.currentTarget);
    const year = String(values.get("releaseYear") ?? "").trim();
    const input: RpgSystemInput = {
      name,
      slug,
      description: String(values.get("description") ?? "").trim() || null,
      publisherId: String(values.get("publisherId") ?? "").trim() || null,
      releaseYear: year ? Number(year) : null,
    };

    try {
      const response = await fetch(current ? `/api/admin/catalog/systems/${current.id}` : "/api/admin/catalog/systems", {
        method: current ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      onSaved(await responseBody<RpgSystem>(response), !current);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível salvar o sistema.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="admin-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) onClose(); }}>
      <section className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="system-editor-title">
        <header><div><p className="panel-eyebrow">{current ? "Edição editorial" : "Novo registro"}</p><h2 id="system-editor-title">{current ? "Editar sistema" : "Cadastrar sistema"}</h2></div><button type="button" onClick={onClose} disabled={pending} aria-label="Fechar"><X /></button></header>
        <form onSubmit={submit}>
          <div className="admin-form-grid">
            <label>Nome do sistema<input value={name} onChange={(event) => { const value = event.target.value; setName(value); if (!slugTouched) setSlug(slugify(value)); }} minLength={1} maxLength={160} required autoFocus /></label>
            <label>Slug<input value={slug} onChange={(event) => { setSlugTouched(true); setSlug(event.target.value.toLowerCase()); }} maxLength={180} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></label>
            <label>Editora<select name="publisherId" defaultValue={current?.publisher?.id ?? ""}><option value="">Sem editora vinculada</option>{publishers.map((publisher) => <option value={publisher.id} key={publisher.id}>{publisher.name}</option>)}</select></label>
            <label>Ano de lançamento<input name="releaseYear" type="number" min={1900} max={2200} defaultValue={current?.releaseYear ?? ""} placeholder="Ex.: 2024" /></label>
            <label className="admin-form-grid__wide">Descrição<textarea name="description" defaultValue={current?.description ?? ""} maxLength={20000} rows={7} placeholder="Contexto editorial e apresentação do sistema." /></label>
          </div>
          {error && <p className="admin-notice admin-notice--error" role="alert">{error}</p>}
          <footer><button className="admin-quiet-button" type="button" onClick={onClose} disabled={pending}>Cancelar</button><button className="admin-primary-button" type="submit" disabled={pending}>{pending ? <><LoaderCircle className="spin" /> Salvando…</> : <><Save /> Salvar sistema</>}</button></footer>
        </form>
      </section>
    </div>
  );
}

export function AdminSystems() {
  const [systems, setSystems] = useState<RpgSystem[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    try {
      const [systemsResponse, publishersResponse] = await Promise.all([
        fetch(`/api/admin/catalog/systems?page=${targetPage}&limit=20`, { cache: "no-store" }),
        fetch("/api/admin/catalog/publishers?page=1&limit=100", { cache: "no-store" }),
      ]);
      const systemBody = await systemsResponse.json() as Paginated<RpgSystem> & ApiFailure;
      const publisherBody = await publishersResponse.json() as Paginated<Publisher> & ApiFailure;
      if (!systemsResponse.ok) throw new Error(Array.isArray(systemBody.message) ? systemBody.message.join(" ") : systemBody.message ?? "Não foi possível carregar os sistemas.");
      if (!publishersResponse.ok) throw new Error(Array.isArray(publisherBody.message) ? publisherBody.message.join(" ") : publisherBody.message ?? "Não foi possível carregar as editoras.");
      setSystems(systemBody.data);
      setPublishers(publisherBody.data);
      setTotal(systemBody.meta.total);
      setTotalPages(Math.max(1, systemBody.meta.totalPages));
    } catch (reason) {
      setNotice({ type: "error", text: reason instanceof Error ? reason.message : "Não foi possível carregar os sistemas." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(page), 0);
    return () => window.clearTimeout(timer);
  }, [load, page]);

  async function transition(system: RpgSystem, action: "publish" | "archive") {
    const verb = action === "publish" ? "publicar" : "arquivar";
    if (!window.confirm(`Deseja ${verb} “${system.name}”?${action === "archive" ? " Esta ação é definitiva." : ""}`)) return;
    setActing(system.id);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/catalog/systems/${system.id}/${action}`, { method: "POST" });
      const changed = await responseBody<{ id: string; status: RpgSystem["status"] }>(response);
      setSystems((current) => current.map((item) => item.id === changed.id ? { ...item, status: changed.status } : item));
      setNotice({ type: "success", text: action === "publish" ? "Sistema publicado no catálogo." : "Sistema arquivado." });
    } catch (reason) {
      setNotice({ type: "error", text: reason instanceof Error ? reason.message : `Não foi possível ${verb} o sistema.` });
    } finally {
      setActing(null);
    }
  }

  function saved(system: RpgSystem, created: boolean) {
    setEditor(null);
    setNotice({ type: "success", text: created ? "Sistema criado como rascunho." : "Alterações salvas." });
    if (created && page !== 1) setPage(1);
    else void load(page);
  }

  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const visibleSystems = normalizedQuery ? systems.filter((system) => [system.name, system.slug, system.publisher?.name ?? ""].some((value) => value.toLocaleLowerCase("pt-BR").includes(normalizedQuery))) : systems;

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div><p className="panel-eyebrow">Catálogo editorial</p><h1>Sistemas de RPG</h1><p>Cadastre, revise e controle a publicação dos sistemas usados no catálogo.</p></div>
        <button className="admin-primary-button" onClick={() => setEditor({ mode: "create" })}><Plus /> Novo sistema</button>
      </header>

      {notice && <p className={`admin-notice admin-notice--${notice.type}`} role="status">{notice.type === "success" && <CheckCircle2 />}{notice.text}</p>}

      <section className="admin-list-card">
        <header className="admin-list-toolbar">
          <div><strong>{total}</strong><span>sistemas cadastrados</span></div>
          <label><Search /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtrar esta página…" aria-label="Filtrar sistemas desta página" /></label>
        </header>

        {loading ? <div className="admin-list-loading"><LoaderCircle className="spin" /> Carregando sistemas…</div> : visibleSystems.length ? (
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Sistema</th><th>Editora</th><th>Ano</th><th>Status</th><th>Atualizado</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{visibleSystems.map((system) => <tr key={system.id}><td><strong>{system.name}</strong><small>/{system.slug}</small></td><td>{system.publisher ? <span>{system.publisher.name}</span> : <span className="admin-muted">Não vinculada</span>}</td><td>{system.releaseYear ?? "—"}</td><td><span className={`admin-status admin-status--${system.status.toLowerCase()}`}>{statusLabels[system.status]}</span></td><td><time dateTime={system.updatedAt}>{new Date(system.updatedAt).toLocaleDateString("pt-BR")}</time></td><td><div className="admin-row-actions"><button onClick={() => setEditor({ mode: "edit", system })} disabled={acting === system.id || system.status === "ARCHIVED"} aria-label={`Editar ${system.name}`}><Edit3 /></button>{system.status === "DRAFT" && <button className="publish" onClick={() => void transition(system, "publish")} disabled={acting === system.id} aria-label={`Publicar ${system.name}`}>{acting === system.id ? <LoaderCircle className="spin" /> : <Send />}</button>}{system.status !== "ARCHIVED" && <button className="archive" onClick={() => void transition(system, "archive")} disabled={acting === system.id} aria-label={`Arquivar ${system.name}`}><Archive /></button>}{system.status === "PUBLISHED" && <a href={`/catalog?systemId=${system.id}`} target="_blank" rel="noreferrer" aria-label={`Ver itens de ${system.name} no catálogo`}><ExternalLink /></a>}</div></td></tr>)}</tbody></table></div>
        ) : <div className="admin-empty"><BoxesIcon /><h2>Nenhum sistema encontrado</h2><p>{query ? "Ajuste o filtro desta página." : "Cadastre o primeiro sistema editorial."}</p></div>}

        <footer className="admin-pagination"><button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || loading}><ChevronLeft /> Anterior</button><span>Página {page} de {totalPages}</span><button onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages || loading}>Próxima <ChevronRight /></button></footer>
      </section>
      {editor && <SystemEditor key={editor.mode === "edit" ? editor.system.id : "new"} editor={editor} publishers={publishers} onClose={() => setEditor(null)} onSaved={saved} />}
    </div>
  );
}

function BoxesIcon() {
  return <span className="admin-empty__icon"><Plus /></span>;
}
