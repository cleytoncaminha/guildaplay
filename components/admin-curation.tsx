"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, ArrowDown, ArrowLeft, ArrowUp, Edit3, ExternalLink, GripVertical, List, LoaderCircle, Plus, Save, Send, Trash2, X } from "lucide-react";
import type { ApiFailure } from "@/lib/auth-types";
import type { CatalogItem, FeaturedList, Paginated } from "@/lib/admin-types";

const statusLabels = { DRAFT: "Rascunho", PUBLISHED: "Publicada", ARCHIVED: "Arquivada" } as const;
const typeLabels: Record<CatalogItem["type"], string> = { CORE_BOOK: "Livro básico", SETTING: "Cenário", ADVENTURE: "Aventura", SUPPLEMENT: "Suplemento", TOOL: "Ferramenta" };

function errorMessage(body: ApiFailure, fallback: string) {
  return Array.isArray(body.message) ? body.message.join(" ") : body.message ?? fallback;
}

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function AdminCuratedLists() {
  const router = useRouter();
  const [lists, setLists] = useState<FeaturedList[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/catalog/lists?page=${targetPage}&limit=20`, { cache: "no-store" });
      const body = await response.json() as Paginated<FeaturedList> & ApiFailure;
      if (!response.ok) throw new Error(errorMessage(body, "Não foi possível carregar as listas."));
      setLists(body.data);
      setTotal(body.meta.total);
      setPages(Math.max(1, body.meta.totalPages));
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "Não foi possível carregar as listas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => void load(page), 0); return () => window.clearTimeout(timer); }, [load, page]);

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div><p className="panel-eyebrow">Curadoria editorial</p><h1>Listas temáticas</h1><p>Monte seleções editoriais, ordene títulos e publique-as no catálogo.</p></div>
        <button className="admin-primary-button" onClick={() => setCreateOpen(true)}><Plus /> Nova lista</button>
      </header>
      {notice && <p className="admin-notice admin-notice--error" role="alert">{notice}</p>}
      <section className="admin-list-card">
        <header className="admin-list-toolbar"><div><strong>{total}</strong><span>listas editoriais</span></div></header>
        {loading ? <div className="admin-list-loading"><LoaderCircle className="spin" /> Carregando…</div> : lists.length ? (
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Lista</th><th>Status</th><th>Itens</th><th>Atualizada</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>
            {lists.map((list) => <tr key={list.id}>
              <td><strong>{list.title}</strong><small>/{list.slug}</small></td>
              <td><span className={`admin-status admin-status--${list.status?.toLowerCase() ?? "draft"}`}>{statusLabels[list.status ?? "DRAFT"]}</span></td>
              <td>{list.items.length}</td>
              <td><time dateTime={list.updatedAt}>{dateLabel(list.updatedAt)}</time></td>
              <td><div className="admin-row-actions"><Link href={`/admin/curated-lists/${list.id}`} aria-label={`Editar ${list.title}`}><Edit3 /></Link>{list.status === "PUBLISHED" && <a href={`/lists/${list.slug}`} target="_blank" rel="noreferrer" aria-label={`Abrir ${list.title}`}><ExternalLink /></a>}</div></td>
            </tr>)}
          </tbody></table></div>
        ) : <div className="admin-empty"><span className="admin-empty__icon"><List /></span><h2>Nenhuma lista criada</h2><p>Comece uma curadoria para destacar itens publicados.</p></div>}
        <footer className="admin-pagination"><button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1}><ArrowLeft /> Anterior</button><span>Página {page} de {pages}</span><button onClick={() => setPage((value) => Math.min(pages, value + 1))} disabled={page >= pages}>Próxima <ArrowLeft className="rotate-180" /></button></footer>
      </section>
      {createOpen && <ListFormDialog onClose={() => setCreateOpen(false)} onCreated={(id) => router.push(`/admin/curated-lists/${id}`)} />}
    </div>
  );
}

function ListFormDialog({ current, onClose, onCreated, onSaved }: { current?: FeaturedList | null; onClose: () => void; onCreated?: (id: string) => void; onSaved?: () => void }) {
  const [title, setTitle] = useState(current?.title ?? "");
  const [slug, setSlug] = useState(current?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(current));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    const data = new FormData(event.currentTarget);
    const body = { title, slug, description: String(data.get("description") ?? "").trim() || null };
    try {
      const response = await fetch(current ? `/api/admin/catalog/lists/${current.id}` : "/api/admin/catalog/lists", { method: current ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json() as { data: FeaturedList } & ApiFailure;
      if (!response.ok) throw new Error(errorMessage(result, "Não foi possível salvar a lista."));
      if (current) onSaved?.(); else onCreated?.(result.data.id);
      onClose();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível salvar a lista."); }
    finally { setPending(false); }
  }

  return <div className="admin-dialog-backdrop"><section className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="list-dialog-title"><header><div><p className="panel-eyebrow">Curadoria editorial</p><h2 id="list-dialog-title">{current ? "Editar lista" : "Nova lista"}</h2></div><button onClick={onClose} aria-label="Fechar"><X /></button></header><form onSubmit={submit}><div className="admin-form-grid"><label>Título<input value={title} onChange={(event) => { const value = event.target.value; setTitle(value); if (!slugTouched) setSlug(slugify(value)); }} maxLength={160} required /></label><label>Slug<input value={slug} onChange={(event) => { setSlugTouched(true); setSlug(event.target.value.toLowerCase()); }} maxLength={180} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></label><label className="admin-form-grid__wide">Descrição<textarea name="description" defaultValue={current?.description ?? ""} rows={5} maxLength={5000} /></label></div>{error && <p className="admin-notice admin-notice--error">{error}</p>}<footer><button type="button" className="admin-quiet-button" onClick={onClose}>Cancelar</button><button className="admin-primary-button" disabled={pending}>{pending ? <LoaderCircle className="spin" /> : <Save />} Salvar</button></footer></form></section></div>;
}

export function AdminCuratedListEditor({ listId }: { listId: string }) {
  const [list, setList] = useState<FeaturedList | null>(null);
  const [candidates, setCandidates] = useState<CatalogItem[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listResponse, itemsResponse] = await Promise.all([
        fetch(`/api/admin/catalog/lists/${listId}`, { cache: "no-store" }),
        fetch("/api/admin/catalog/items?page=1&limit=100", { cache: "no-store" }),
      ]);
      const listBody = await listResponse.json() as { data: FeaturedList } & ApiFailure;
      const itemsBody = await itemsResponse.json() as Paginated<CatalogItem> & ApiFailure;
      if (!listResponse.ok) throw new Error(errorMessage(listBody, "Lista não encontrada."));
      if (!itemsResponse.ok) throw new Error(errorMessage(itemsBody, "Não foi possível carregar os itens publicados."));
      setList(listBody.data); setCandidates(itemsBody.data.filter((item) => item.status === "PUBLISHED"));
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "Não foi possível abrir a lista."); }
    finally { setLoading(false); }
  }, [listId]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  async function request(path: string, init?: RequestInit) {
    const response = await fetch(path, init);
    let body: ApiFailure = {};
    try { body = await response.json() as ApiFailure; } catch { /* 204 */ }
    if (!response.ok) throw new Error(errorMessage(body, "Não foi possível concluir a operação."));
  }

  async function transition(action: "publish" | "archive") {
    if (!list) return;
    setPending(true); setNotice("");
    try { await request(`/api/admin/catalog/lists/${list.id}/${action}`, { method: "POST" }); await load(); setNotice(action === "publish" ? "Lista publicada com sucesso." : "Lista arquivada com sucesso."); }
    catch (reason) { setNotice(reason instanceof Error ? reason.message : "Não foi possível atualizar o status."); }
    finally { setPending(false); }
  }

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!list || !selected) return;
    setPending(true); setNotice("");
    try { await request(`/api/admin/catalog/lists/${list.id}/items/${selected}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ position: list.items.length }) }); setSelected(""); await load(); setNotice("Item adicionado à lista."); }
    catch (reason) { setNotice(reason instanceof Error ? reason.message : "Não foi possível adicionar o item."); }
    finally { setPending(false); }
  }

  async function removeItem(itemId: string) {
    if (!list) return;
    setPending(true); setNotice("");
    try { await request(`/api/admin/catalog/lists/${list.id}/items/${itemId}`, { method: "DELETE" }); await load(); setNotice("Item removido da lista."); }
    catch (reason) { setNotice(reason instanceof Error ? reason.message : "Não foi possível remover o item."); }
    finally { setPending(false); }
  }

  async function moveItem(index: number, direction: -1 | 1) {
    if (!list || index + direction < 0 || index + direction >= list.items.length) return;
    const ordered = list.items.map((entry) => entry.item.id);
    [ordered[index], ordered[index + direction]] = [ordered[index + direction], ordered[index]];
    setPending(true); setNotice("");
    try {
      for (const itemId of list.items.map((entry) => entry.item.id)) await request(`/api/admin/catalog/lists/${list.id}/items/${itemId}`, { method: "DELETE" });
      for (const [position, itemId] of ordered.entries()) await request(`/api/admin/catalog/lists/${list.id}/items/${itemId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ position }) });
      await load(); setNotice("Ordem atualizada.");
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "Não foi possível ordenar os itens."); await load(); }
    finally { setPending(false); }
  }

  const available = useMemo(() => new Set(list?.items.map((entry) => entry.item.id) ?? []), [list]);

  if (loading) return <div className="admin-list-loading"><LoaderCircle className="spin" /> Preparando lista…</div>;
  if (!list) return <div className="admin-page"><p className="admin-notice admin-notice--error">{notice || "Lista não encontrada."}</p><Link className="admin-back-link" href="/admin/curated-lists"><ArrowLeft /> Voltar às listas</Link></div>;

  return <div className="admin-page">
    <header className="admin-page__header"><div><Link className="admin-back-link" href="/admin/curated-lists"><ArrowLeft /> Voltar às listas</Link><p className="panel-eyebrow">Editor de curadoria</p><h1>{list.title}</h1><p>Defina a narrativa da lista e mantenha os itens na ordem certa.</p></div><div className="admin-header-actions"><span className={`admin-status admin-status--${list.status?.toLowerCase() ?? "draft"}`}>{statusLabels[list.status ?? "DRAFT"]}</span><button className="admin-quiet-button" onClick={() => setEditOpen(true)} disabled={pending}><Edit3 /> Editar dados</button>{list.status === "DRAFT" && <button className="admin-primary-button" onClick={() => void transition("publish")} disabled={pending}><Send /> Publicar</button>}{list.status !== "ARCHIVED" && <button className="admin-danger-button" onClick={() => void transition("archive")} disabled={pending}><Archive /> Arquivar</button>}</div></header>
    {notice && <p className={`admin-notice ${notice.includes("sucesso") || notice.includes("adicionado") || notice.includes("removido") || notice.includes("atualizada") ? "admin-notice--success" : "admin-notice--error"}`} role="status">{notice}</p>}
    <section className="admin-editor-section"><div className="admin-list-detail-heading"><div><p className="panel-eyebrow">Itens publicados</p><h2>{list.items.length} {list.items.length === 1 ? "item" : "itens"}</h2></div><form className="admin-inline-form" onSubmit={addItem}><select value={selected} onChange={(event) => setSelected(event.target.value)} disabled={pending || list.status === "ARCHIVED"}><option value="">Adicionar item publicado…</option>{candidates.filter((item) => !available.has(item.id)).map((item) => <option key={item.id} value={item.id}>{item.title} · {typeLabels[item.type]}</option>)}</select><button className="admin-primary-button" disabled={pending || !selected || list.status === "ARCHIVED"}><Plus /> Adicionar</button></form></div>
      {list.items.length ? <ol className="admin-curated-items">{list.items.map((entry, index) => <li key={entry.item.id}><span className="admin-curated-item__position">{String(index + 1).padStart(2, "0")}</span><GripVertical className="admin-curated-item__grip" aria-hidden="true" /><div><strong>{entry.item.title}</strong><small>{entry.item.slug} · {typeLabels[entry.item.type]}</small></div><div className="admin-row-actions"><button onClick={() => void moveItem(index, -1)} disabled={pending || index === 0 || list.status === "ARCHIVED"} aria-label="Mover para cima"><ArrowUp /></button><button onClick={() => void moveItem(index, 1)} disabled={pending || index === list.items.length - 1 || list.status === "ARCHIVED"} aria-label="Mover para baixo"><ArrowDown /></button><button className="archive" onClick={() => void removeItem(entry.item.id)} disabled={pending || list.status === "ARCHIVED"} aria-label={`Remover ${entry.item.title}`}><Trash2 /></button></div></li>)}</ol> : <div className="admin-empty admin-empty--compact"><span className="admin-empty__icon"><List /></span><h2>A lista ainda está vazia</h2><p>Adicione apenas itens publicados no catálogo.</p></div>}
    </section>
    <section className="admin-editor-section admin-list-summary"><p className="panel-eyebrow">Descrição</p><p>{list.description || "Nenhuma descrição adicionada."}</p>{list.status === "PUBLISHED" && <Link className="admin-external-link" href={`/lists/${list.slug}`} target="_blank">Ver página pública <ExternalLink /></Link>}</section>
    {editOpen && <ListFormDialog current={list} onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); void load(); }} />}
  </div>;
}
