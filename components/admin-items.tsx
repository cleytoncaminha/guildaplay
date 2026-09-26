"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Edit3, ExternalLink, LoaderCircle, Plus, Save, Search, Send } from "lucide-react";
import type { ApiFailure } from "@/lib/auth-types";
import type { CatalogCategory, CatalogItem, CatalogItemType, CatalogTag, Creator, CreatorRole, Paginated, RpgSystem } from "@/lib/admin-types";

const typeLabels: Record<CatalogItemType, string> = { CORE_BOOK: "Livro básico", SETTING: "Cenário", ADVENTURE: "Aventura", SUPPLEMENT: "Suplemento", TOOL: "Ferramenta" };
const statusLabels = { DRAFT: "Rascunho", PUBLISHED: "Publicado", ARCHIVED: "Arquivado" } as const;
const roleLabels: Record<CreatorRole, string> = { AUTHOR: "Autor", DESIGNER: "Designer", ILLUSTRATOR: "Ilustrador", EDITOR: "Editor", TRANSLATOR: "Tradutor", OTHER: "Outro" };

function slugify(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
function message(body: ApiFailure, fallback: string) { return Array.isArray(body.message) ? body.message.join(" ") : body.message ?? fallback; }

export function AdminItems() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/catalog/items?page=${targetPage}&limit=20`, { cache: "no-store" });
      const body = await response.json() as Paginated<CatalogItem> & ApiFailure;
      if (!response.ok) throw new Error(message(body, "Não foi possível carregar os itens."));
      setItems(body.data); setMeta({ total: body.meta.total, totalPages: Math.max(1, body.meta.totalPages) });
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "Não foi possível carregar os itens."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => void load(page), 0); return () => window.clearTimeout(timer); }, [load, page]);

  async function transition(item: CatalogItem, action: "publish" | "archive") {
    const verb = action === "publish" ? "publicar" : "arquivar";
    if (!window.confirm(`Deseja ${verb} “${item.title}”?${action === "archive" ? " Esta ação é definitiva." : ""}`)) return;
    setActing(item.id); setNotice("");
    try {
      const response = await fetch(`/api/admin/catalog/items/${item.id}/${action}`, { method: "POST" });
      const body = await response.json() as { data: { id: string; status: CatalogItem["status"] } } & ApiFailure;
      if (!response.ok) throw new Error(message(body, `Não foi possível ${verb} o item.`));
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: body.data.status } : entry));
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : `Não foi possível ${verb} o item.`); }
    finally { setActing(null); }
  }

  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  const visible = normalized ? items.filter((item) => `${item.title} ${item.slug}`.toLocaleLowerCase("pt-BR").includes(normalized)) : items;

  return <div className="admin-page"><header className="admin-page__header"><div><p className="panel-eyebrow">Catálogo editorial</p><h1>Itens</h1><p>Gerencie livros, cenários, aventuras, suplementos e ferramentas.</p></div><Link className="admin-primary-button" href="/admin/catalog/items/new"><Plus /> Novo item</Link></header>{notice && <p className="admin-notice admin-notice--error" role="alert">{notice}</p>}<section className="admin-list-card"><header className="admin-list-toolbar"><div><strong>{meta.total}</strong><span>itens cadastrados</span></div><label><Search /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtrar esta página…" /></label></header>{loading ? <div className="admin-list-loading"><LoaderCircle className="spin" /> Carregando itens…</div> : visible.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Item</th><th>Tipo</th><th>Sistemas</th><th>Status</th><th>Atualizado</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{visible.map((item) => <tr key={item.id}><td><strong>{item.title}</strong><small>/{item.slug}</small></td><td>{typeLabels[item.type]}</td><td>{item.systems.map((system) => system.name).join(", ") || <span className="admin-muted">Nenhum</span>}</td><td><span className={`admin-status admin-status--${item.status.toLowerCase()}`}>{statusLabels[item.status]}</span></td><td><time dateTime={item.updatedAt}>{new Date(item.updatedAt).toLocaleDateString("pt-BR")}</time></td><td><div className="admin-row-actions"><Link href={`/admin/catalog/items/${item.id}` as Route} aria-label={`Editar ${item.title}`}><Edit3 /></Link>{item.status === "DRAFT" && <button className="publish" onClick={() => void transition(item, "publish")} disabled={acting === item.id}><Send /></button>}{item.status !== "ARCHIVED" && <button className="archive" onClick={() => void transition(item, "archive")} disabled={acting === item.id}><Archive /></button>}{item.status === "PUBLISHED" && <a href={`/catalog/${item.slug}`} target="_blank" rel="noreferrer"><ExternalLink /></a>}</div></td></tr>)}</tbody></table></div> : <div className="admin-empty"><span className="admin-empty__icon"><BookOpen /></span><h2>Nenhum item encontrado</h2><p>Crie o primeiro item editorial.</p></div>}<footer className="admin-pagination"><button onClick={() => setPage((value) => Math.max(1,value-1))} disabled={page<=1||loading}><ChevronLeft /> Anterior</button><span>Página {page} de {meta.totalPages}</span><button onClick={() => setPage((value) => Math.min(meta.totalPages,value+1))} disabled={page>=meta.totalPages||loading}>Próxima <ChevronRight /></button></footer></section></div>;
}

type Dependencies = { systems: RpgSystem[]; categories: CatalogCategory[]; tags: CatalogTag[]; creators: Creator[]; items: CatalogItem[] };

async function fetchList<T>(resource: string) {
  const response = await fetch(`/api/admin/catalog/${resource}?page=1&limit=100`, { cache: "no-store" });
  const body = await response.json() as Paginated<T> & ApiFailure;
  if (!response.ok) throw new Error(message(body, `Não foi possível carregar ${resource}.`));
  return body.data;
}

export function AdminItemEditor({ itemId }: { itemId?: string }) {
  const router = useRouter();
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [dependencies, setDependencies] = useState<Dependencies | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(Boolean(itemId));
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchList<RpgSystem>("systems"), fetchList<CatalogCategory>("categories"), fetchList<CatalogTag>("tags"), fetchList<Creator>("creators"), fetchList<CatalogItem>("items"),
      itemId ? fetch(`/api/admin/catalog/items/${itemId}`, { cache: "no-store" }).then(async (response) => { const body = await response.json() as { data: CatalogItem } & ApiFailure; if (!response.ok) throw new Error(message(body,"Item não encontrado.")); return body.data; }) : Promise.resolve(null),
    ]).then(([systems,categories,tags,creators,items,current]) => { if (!active) return; setDependencies({ systems,categories,tags,creators,items }); setItem(current); setTitle(current?.title ?? ""); setSlug(current?.slug ?? ""); }).catch((reason: unknown) => { if (active) setNotice(reason instanceof Error ? reason.message : "Não foi possível abrir o editor."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [itemId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!dependencies) return;
    setPending(true); setNotice("");
    const values = new FormData(event.currentTarget);
    const year = String(values.get("originalReleaseYear") ?? "").trim();
    const creatorIds = values.getAll("creatorIds").map(String);
    const body = {
      type: values.get("type"), title, slug,
      summary: String(values.get("summary") ?? "").trim() || null,
      description: String(values.get("description") ?? "").trim() || null,
      originalReleaseYear: year ? Number(year) : null,
      experienceLevel: String(values.get("experienceLevel") ?? "") || null,
      systemIds: values.getAll("systemIds").map(String), categoryIds: values.getAll("categoryIds").map(String), tagIds: values.getAll("tagIds").map(String),
      creators: creatorIds.map((creatorId) => ({ creatorId, role: values.get(`creatorRole-${creatorId}`) || "AUTHOR" })),
    };
    try {
      const response = await fetch(itemId ? `/api/admin/catalog/items/${itemId}` : "/api/admin/catalog/items", { method: itemId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json() as { data: CatalogItem } & ApiFailure;
      if (!response.ok) throw new Error(message(result,"Não foi possível salvar o item."));
      setItem(result.data); setTitle(result.data.title); setSlug(result.data.slug); setSlugTouched(true); setNotice("Item salvo com sucesso.");
      if (!itemId) router.replace(`/admin/catalog/items/${result.data.id}` as Route);
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "Não foi possível salvar o item."); }
    finally { setPending(false); }
  }

  async function reloadItem() {
    if (!itemId) return;
    const response = await fetch(`/api/admin/catalog/items/${itemId}`, { cache: "no-store" });
    const body = await response.json() as { data: CatalogItem } & ApiFailure;
    if (response.ok) setItem(body.data);
  }

  if (loading) return <div className="admin-list-loading"><LoaderCircle className="spin" /> Preparando editor…</div>;
  if (!dependencies) return <div className="admin-page"><p className="admin-notice admin-notice--error">{notice || "Editor indisponível."}</p></div>;

  return <div className="admin-page"><header className="admin-page__header"><div><Link className="admin-back-link" href="/admin/catalog/items"><ArrowLeft /> Voltar aos itens</Link><p className="panel-eyebrow">Editor de item</p><h1>{item ? item.title : "Novo item"}</h1><p>Dados editoriais e associações principais do catálogo.</p></div>{item && <span className={`admin-status admin-status--${item.status.toLowerCase()}`}>{statusLabels[item.status]}</span>}</header>{notice && <p className={`admin-notice ${notice.includes("sucesso") ? "admin-notice--success" : "admin-notice--error"}`} role="status">{notice}</p>}<form className="admin-editor-card" onSubmit={submit}><section className="admin-editor-section"><h2>Informações editoriais</h2><div className="admin-form-grid"><label>Título<input value={title} onChange={(event) => { const value=event.target.value; setTitle(value); if(!slugTouched)setSlug(slugify(value)); }} maxLength={255} required /></label><label>Slug<input value={slug} onChange={(event)=>{setSlugTouched(true);setSlug(event.target.value.toLowerCase());}} maxLength={280} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></label><label>Tipo<select name="type" defaultValue={item?.type ?? "CORE_BOOK"}>{Object.entries(typeLabels).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label><label>Ano original<input name="originalReleaseYear" type="number" min={1900} max={2200} defaultValue={item?.originalReleaseYear ?? ""} /></label><label>Nível de experiência<select name="experienceLevel" defaultValue={item?.experienceLevel ?? ""}><option value="">Não informado</option><option value="BEGINNER">Iniciante</option><option value="INTERMEDIATE">Intermediário</option><option value="ADVANCED">Avançado</option></select></label><label className="admin-form-grid__wide">Resumo<textarea name="summary" defaultValue={item?.summary ?? ""} maxLength={1000} rows={3} /></label><label className="admin-form-grid__wide">Descrição completa<textarea name="description" defaultValue={item?.description ?? ""} maxLength={20000} rows={9} /></label></div></section><Association title="Sistemas" name="systemIds" options={dependencies.systems} selected={new Set(item?.systems.map((value)=>value.id))} /><Association title="Categorias" name="categoryIds" options={dependencies.categories} selected={new Set(item?.categories.map((value)=>value.id))} /><Association title="Tags" name="tagIds" options={dependencies.tags} selected={new Set(item?.tags.map((value)=>value.id))} /><section className="admin-editor-section"><h2>Criadores</h2><div className="admin-association-grid">{dependencies.creators.map((creator)=>{const assigned=item?.creators.find((value)=>value.id===creator.id);return <label className="admin-creator-option" key={creator.id}><span><input type="checkbox" name="creatorIds" value={creator.id} defaultChecked={Boolean(assigned)} />{creator.name}</span><select name={`creatorRole-${creator.id}`} defaultValue={assigned?.role ?? "AUTHOR"}>{Object.entries(roleLabels).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label>;})}</div></section><footer className="admin-editor-footer"><Link className="admin-quiet-button" href="/admin/catalog/items">Cancelar</Link><button className="admin-primary-button" disabled={pending||item?.status==="ARCHIVED"}>{pending?<><LoaderCircle className="spin" /> Salvando…</>:<><Save /> Salvar item</>}</button></footer></form>{item&&<ItemExtensions item={item} candidates={dependencies.items} onChanged={reloadItem}/>}</div>;
}

function Association<T extends { id:string; name:string }>({ title, name, options, selected }: { title:string; name:string; options:T[]; selected:Set<string> }) { return <section className="admin-editor-section"><h2>{title}</h2>{options.length?<div className="admin-association-grid">{options.map((option)=><label className="admin-check-option" key={option.id}><input type="checkbox" name={name} value={option.id} defaultChecked={selected.has(option.id)} /><span>{option.name}</span></label>)}</div>:<p className="admin-muted">Nenhum cadastro disponível.</p>}</section>; }

function ItemExtensions({item,candidates,onChanged}:{item:CatalogItem;candidates:CatalogItem[];onChanged:()=>Promise<void>}){
  const [pending,setPending]=useState(false),[notice,setNotice]=useState("");
  async function post(path:string,body?:unknown,method="POST"){setPending(true);setNotice("");try{const response=await fetch(path,{method,headers:body?{"Content-Type":"application/json"}:undefined,body:body?JSON.stringify(body):undefined});const result=await response.json() as ApiFailure;if(!response.ok)throw new Error(message(result,"Operação não concluída."));await onChanged();setNotice("Alteração salva com sucesso.");}catch(reason){setNotice(reason instanceof Error?reason.message:"Operação não concluída.");}finally{setPending(false);}}
  async function alias(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=event.currentTarget,value=String(new FormData(form).get("alias")??"");await post(`/api/admin/catalog/items/${item.id}/aliases`,{alias:value});form.reset();}
  async function source(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=event.currentTarget,data=new FormData(form);await post(`/api/admin/catalog/items/${item.id}/sources`,{label:data.get("label"),url:data.get("url")});form.reset();}
  async function relation(event:FormEvent<HTMLFormElement>){event.preventDefault();const data=new FormData(event.currentTarget);await post(`/api/admin/catalog/items/${item.id}/relations`,{targetItemId:data.get("targetItemId"),type:data.get("type")});}
  async function upload(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=event.currentTarget,data=new FormData(form),file=data.get("file");if(!(file instanceof File)||!file.size)return;setPending(true);setNotice("");try{const response=await fetch("/api/admin/catalog/media/upload-url",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({purpose:data.get("purpose"),mimeType:file.type,sizeBytes:file.size,catalogItemId:item.id})});const presign=await response.json() as {data:{assetId:string;uploadUrl:string}}&ApiFailure;if(!response.ok)throw new Error(message(presign,"Não foi possível preparar o upload."));const sent=await fetch(presign.data.uploadUrl,{method:"PUT",headers:{"Content-Type":file.type},body:file});if(!sent.ok)throw new Error("O armazenamento recusou o arquivo.");await post(`/api/admin/catalog/media/${presign.data.assetId}/complete`);form.reset();}catch(reason){setNotice(reason instanceof Error?reason.message:"Não foi possível enviar a mídia.");setPending(false);}}
  return <section className="admin-extensions"><header><p className="panel-eyebrow">Complementos do item</p><h2>Aliases, fontes, relações e mídia</h2></header>{notice&&<p className={`admin-notice ${notice.includes("sucesso")?"admin-notice--success":"admin-notice--error"}`}>{notice}</p>}<div className="admin-extension-grid"><article><h3>Aliases</h3><ul>{item.aliases.map((entry)=><li key={entry.id}>{entry.alias}</li>)}</ul><form onSubmit={alias}><input name="alias" placeholder="Novo alias" required maxLength={255}/><button disabled={pending}><Plus/>Adicionar</button></form></article><article><h3>Fontes</h3><ul>{item.sources.map((entry)=><li key={entry.id}><a href={entry.url} target="_blank" rel="noreferrer">{entry.label}</a></li>)}</ul><form onSubmit={source}><input name="label" placeholder="Rótulo" required/><input name="url" type="url" placeholder="https://…" required/><button disabled={pending}><Plus/>Adicionar</button></form></article><article><h3>Relações</h3><ul>{item.relations.map((entry)=><li key={entry.id}><span>{entry.item.title}</span><button onClick={()=>void post(`/api/admin/catalog/items/${item.id}/relations/${entry.id}`,undefined,"DELETE")}>×</button></li>)}</ul><form onSubmit={relation}><select name="targetItemId" required><option value="">Item relacionado</option>{candidates.filter((candidate)=>candidate.id!==item.id).map((candidate)=><option value={candidate.id} key={candidate.id}>{candidate.title}</option>)}</select><select name="type"><option value="REQUIRES">Requer</option><option value="SUPPLEMENT_OF">Suplemento de</option><option value="ADVENTURE_FOR">Aventura para</option><option value="SETTING_FOR">Cenário para</option><option value="EDITION_OF">Edição de</option><option value="EXPANSION_OF">Expansão de</option><option value="COMPATIBLE_WITH">Compatível com</option></select><button disabled={pending}><Plus/>Adicionar</button></form></article><article><h3>Mídia</h3><div className="admin-media-list">{item.media.map((media)=><a href={media.url} target="_blank" rel="noreferrer" key={media.id}>{media.kind==="COVER"?"Capa":"Imagem"} #{media.position+1}</a>)}</div><form onSubmit={upload}><select name="purpose"><option value="CATALOG_COVER">Capa</option><option value="CATALOG_IMAGE">Imagem</option></select><input name="file" type="file" accept="image/jpeg,image/png,image/webp" required/><button disabled={pending}>{pending?<LoaderCircle className="spin"/>:<Plus/>}Enviar</button></form></article></div></section>;
}
