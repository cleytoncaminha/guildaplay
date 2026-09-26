"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Building2, ChevronLeft, ChevronRight, Edit3, FolderTree, Globe2, LoaderCircle, Plus, Save, Search, Tags, UsersRound, X } from "lucide-react";
import type { ApiFailure } from "@/lib/auth-types";
import type { Paginated, ReferenceRecord } from "@/lib/admin-types";

type ReferenceKind = "publishers" | "creators" | "categories" | "tags";
type Notice = { type: "success" | "error"; text: string } | null;

const configs: Record<ReferenceKind, { title: string; singular: string; description: string; icon: LucideIcon; website?: boolean; country?: boolean; longDescription?: boolean }> = {
  publishers: { title: "Editoras", singular: "editora", description: "Organize as empresas responsáveis pelas publicações e edições.", icon: Building2, website: true, country: true },
  creators: { title: "Criadores", singular: "criador", description: "Mantenha autores, ilustradores, tradutores e demais colaboradores.", icon: UsersRound, website: true },
  categories: { title: "Categorias", singular: "categoria", description: "Estruture gêneros e classificações editoriais do catálogo.", icon: FolderTree, longDescription: true },
  tags: { title: "Tags", singular: "tag", description: "Cadastre marcadores editoriais para descoberta e organização.", icon: Tags },
};

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function readData<T>(response: Response) {
  const body = await response.json() as { data: T } & ApiFailure;
  if (!response.ok) {
    const message = Array.isArray(body.message) ? body.message.join(" ") : body.message;
    throw new Error(message ?? "Não foi possível concluir a operação.");
  }
  return body.data;
}

function ReferenceEditor({ kind, current, onClose, onSaved }: { kind: ReferenceKind; current: ReferenceRecord | null; onClose: () => void; onSaved: (record: ReferenceRecord) => void }) {
  const config = configs[kind];
  const [name, setName] = useState(current?.name ?? "");
  const [slug, setSlug] = useState(current?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(current));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const values = new FormData(event.currentTarget);
    const body: Record<string, string | null> = { name, slug };
    if (config.website) body.websiteUrl = String(values.get("websiteUrl") ?? "").trim() || null;
    if (config.country) body.countryCode = String(values.get("countryCode") ?? "").trim().toUpperCase() || null;
    if (config.longDescription) body.description = String(values.get("description") ?? "").trim() || null;

    try {
      const response = await fetch(current ? `/api/admin/catalog/${kind}/${current.id}` : `/api/admin/catalog/${kind}`, {
        method: current ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      onSaved(await readData<ReferenceRecord>(response));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível salvar este cadastro.");
    } finally {
      setPending(false);
    }
  }

  const website = current && "websiteUrl" in current ? current.websiteUrl : null;
  const country = current && "countryCode" in current ? current.countryCode : null;
  const description = current && "description" in current ? current.description : null;

  return (
    <div className="admin-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) onClose(); }}>
      <section className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="reference-editor-title">
        <header><div><p className="panel-eyebrow">Cadastro auxiliar</p><h2 id="reference-editor-title">{current ? "Editar" : "Cadastrar"} {config.singular}</h2></div><button type="button" onClick={onClose} disabled={pending} aria-label="Fechar"><X /></button></header>
        <form onSubmit={submit}>
          <div className="admin-form-grid">
            <label>Nome<input value={name} onChange={(event) => { const value = event.target.value; setName(value); if (!slugTouched) setSlug(slugify(value)); }} maxLength={kind === "tags" ? 80 : kind === "categories" ? 120 : 160} required autoFocus /></label>
            <label>Slug<input value={slug} onChange={(event) => { setSlugTouched(true); setSlug(event.target.value.toLowerCase()); }} maxLength={kind === "tags" ? 100 : kind === "categories" ? 140 : 180} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></label>
            {config.website && <label className={config.country ? undefined : "admin-form-grid__wide"}>Website<input name="websiteUrl" type="url" defaultValue={website ?? ""} maxLength={500} placeholder="https://…" /></label>}
            {config.country && <label>País<input name="countryCode" defaultValue={country ?? ""} minLength={2} maxLength={2} placeholder="BR" /></label>}
            {config.longDescription && <label className="admin-form-grid__wide">Descrição<textarea name="description" defaultValue={description ?? ""} maxLength={5000} rows={6} /></label>}
          </div>
          {error && <p className="admin-notice admin-notice--error" role="alert">{error}</p>}
          <footer><button className="admin-quiet-button" type="button" onClick={onClose} disabled={pending}>Cancelar</button><button className="admin-primary-button" type="submit" disabled={pending}>{pending ? <><LoaderCircle className="spin" /> Salvando…</> : <><Save /> Salvar</>}</button></footer>
        </form>
      </section>
    </div>
  );
}

export function AdminReferenceData({ kind }: { kind: ReferenceKind }) {
  const config = configs[kind];
  const Icon = config.icon;
  const [records, setRecords] = useState<ReferenceRecord[]>([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<ReferenceRecord | "new" | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/catalog/${kind}?page=${targetPage}&limit=20`, { cache: "no-store" });
      const body = await response.json() as Paginated<ReferenceRecord> & ApiFailure;
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? `Não foi possível carregar ${config.title.toLowerCase()}.`);
      setRecords(body.data);
      setMeta({ total: body.meta.total, totalPages: Math.max(1, body.meta.totalPages) });
    } catch (reason) {
      setNotice({ type: "error", text: reason instanceof Error ? reason.message : `Não foi possível carregar ${config.title.toLowerCase()}.` });
    } finally {
      setLoading(false);
    }
  }, [config.title, kind]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(page), 0);
    return () => window.clearTimeout(timer);
  }, [load, page]);

  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  const visible = normalized ? records.filter((record) => `${record.name} ${record.slug}`.toLocaleLowerCase("pt-BR").includes(normalized)) : records;

  return (
    <div className="admin-page">
      <header className="admin-page__header"><div><p className="panel-eyebrow">Catálogo editorial</p><h1>{config.title}</h1><p>{config.description}</p></div><button className="admin-primary-button" onClick={() => setEditor("new")}><Plus /> {kind === "creators" ? "Novo" : "Nova"} {config.singular}</button></header>
      {notice && <p className={`admin-notice admin-notice--${notice.type}`} role="status">{notice.text}</p>}
      <section className="admin-list-card">
        <header className="admin-list-toolbar"><div><strong>{meta.total}</strong><span>registros cadastrados</span></div><label><Search /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtrar esta página…" /></label></header>
        {loading ? <div className="admin-list-loading"><LoaderCircle className="spin" /> Carregando…</div> : visible.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Nome</th><th>Detalhe</th><th>Atualizado</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{visible.map((record) => {
          const detail = "websiteUrl" in record && record.websiteUrl ? record.websiteUrl : "countryCode" in record && record.countryCode ? record.countryCode : "description" in record && record.description ? record.description : "—";
          return <tr key={record.id}><td><strong>{record.name}</strong><small>/{record.slug}</small></td><td>{detail === "—" ? <span className="admin-muted">Sem detalhe</span> : String(detail).startsWith("http") ? <a className="admin-external-link" href={String(detail)} target="_blank" rel="noreferrer"><Globe2 /> Visitar</a> : String(detail)}</td><td><time dateTime={record.updatedAt}>{new Date(record.updatedAt).toLocaleDateString("pt-BR")}</time></td><td><div className="admin-row-actions"><button onClick={() => setEditor(record)} aria-label={`Editar ${record.name}`}><Edit3 /></button></div></td></tr>;
        })}</tbody></table></div> : <div className="admin-empty"><span className="admin-empty__icon"><Icon /></span><h2>Nenhum registro encontrado</h2><p>Crie o primeiro cadastro desta seção.</p></div>}
        <footer className="admin-pagination"><button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || loading}><ChevronLeft /> Anterior</button><span>Página {page} de {meta.totalPages}</span><button onClick={() => setPage((value) => Math.min(meta.totalPages, value + 1))} disabled={page >= meta.totalPages || loading}>Próxima <ChevronRight /></button></footer>
      </section>
      {editor && <ReferenceEditor key={editor === "new" ? `new-${kind}` : editor.id} kind={kind} current={editor === "new" ? null : editor} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); setNotice({ type: "success", text: `${config.singular.charAt(0).toUpperCase()}${config.singular.slice(1)} salva com sucesso.` }); void load(page); }} />}
    </div>
  );
}
