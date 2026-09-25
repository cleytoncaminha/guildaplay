"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Flag, ImageIcon, LoaderCircle, Search, ShieldAlert } from "lucide-react";
import type { CatalogItem, CatalogResponse } from "./catalog-data";
import { typeLabels } from "./catalog-data";

type ReportTarget = Pick<CatalogItem, "id" | "title" | "slug" | "type" | "media">;
type ReportReason = "DUPLICATE" | "INACCURATE" | "COPYRIGHT" | "INAPPROPRIATE" | "OTHER";

const reasons: { value: ReportReason; label: string }[] = [
  { value: "INACCURATE", label: "Informação incorreta" },
  { value: "DUPLICATE", label: "Título duplicado" },
  { value: "COPYRIGHT", label: "Problema de direitos autorais" },
  { value: "INAPPROPRIATE", label: "Conteúdo inadequado" },
  { value: "OTHER", label: "Outro problema" },
];

async function readResponse<T>(response: Response): Promise<T> {
  const body = await response.json() as { data?: T; message?: string | string[] };
  if (!response.ok) {
    const message = Array.isArray(body.message) ? body.message.join(" ") : body.message;
    throw Object.assign(new Error(message ?? "Não foi possível concluir a solicitação."), { status: response.status });
  }
  return body.data as T;
}

export function ReportForm({ item }: { item: ReportTarget }) {
  const router = useRouter();
  const [targetType, setTargetType] = useState<"ITEM" | "MEDIA">("ITEM");
  const [reason, setReason] = useState<ReportReason>("INACCURATE");
  const [duplicateTarget, setDuplicateTarget] = useState<Pick<CatalogItem, "id" | "title" | "type"> | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetch("/api/auth/session", { cache: "no-store" }).then(async (response) => {
        const body = await response.json() as { data?: unknown };
        if (!response.ok || !body.data) router.replace(`/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      }).catch(() => setError("Não foi possível confirmar sua sessão."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [router]);

  function changeTargetType(value: "ITEM" | "MEDIA") {
    setTargetType(value);
    setError(null);
    if (value === "MEDIA" && reason === "DUPLICATE") setReason("INACCURATE");
  }

  async function searchDuplicate() {
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const response = await fetch(`/api/catalog?q=${encodeURIComponent(query.trim())}&limit=8`, { cache: "no-store" });
      if (!response.ok) {
        const failure = await response.json() as { message?: string | string[] };
        throw new Error(Array.isArray(failure.message) ? failure.message.join(" ") : failure.message ?? "Não foi possível pesquisar o catálogo.");
      }
      const result = await response.json() as CatalogResponse;
      const matches = result.data.filter((candidate) => candidate.id !== item.id);
      setResults(matches);
      if (!matches.length) setError("Nenhum outro título foi encontrado para essa busca.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível pesquisar o catálogo.");
    } finally {
      setSearching(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    const body = targetType === "ITEM"
      ? {
          targetType,
          catalogItemId: item.id,
          reason,
          ...(reason === "DUPLICATE" && duplicateTarget ? { duplicateOfCatalogItemId: duplicateTarget.id } : {}),
          description: String(data.get("description") ?? ""),
        }
      : {
          targetType,
          mediaAssetId: String(data.get("mediaAssetId") ?? ""),
          reason,
          description: String(data.get("description") ?? ""),
        };
    try {
      const response = await fetch("/api/me/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const report = await readResponse<{ id: string }>(response);
      setReportId(report.id);
    } catch (requestError) {
      if ((requestError as { status?: number }).status === 401) router.replace(`/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      else setError(requestError instanceof Error ? requestError.message : "Não foi possível enviar a denúncia.");
    } finally {
      setPending(false);
    }
  }

  if (reportId) {
    return <div className="report-complete"><CheckCircle2 /><p className="panel-eyebrow">Relato recebido</p><h2>Obrigado por ajudar a cuidar do catálogo</h2><p>A equipe de moderação recebeu a denúncia e fará a análise. Protocolo: <strong>{reportId}</strong>.</p><Link className="button-primary" href={`/catalog/${item.slug}`}>Voltar ao título <ArrowRight /></Link></div>;
  }

  return (
    <div className="report-layout">
      <aside className="report-target-card"><ShieldAlert /><p className="panel-eyebrow">Conteúdo denunciado</p><h2>{item.title}</h2><span>{typeLabels[item.type]}</span><p>Use este canal somente para problemas editoriais, legais ou de segurança.</p></aside>
      <form className="report-form" onSubmit={submit}>
        <fieldset><legend>Onde está o problema?</legend><div className="report-choice-row"><button className={targetType === "ITEM" ? "active" : ""} type="button" onClick={() => changeTargetType("ITEM")}><Flag /> Página do título</button><button className={targetType === "MEDIA" ? "active" : ""} type="button" disabled={!item.media.length} onClick={() => changeTargetType("MEDIA")}><ImageIcon /> Imagem ou capa</button></div></fieldset>
        {targetType === "MEDIA" && <label>Mídia denunciada<select name="mediaAssetId" required defaultValue=""><option value="">Selecione a mídia</option>{item.media.map((media, index) => <option value={media.id} key={media.id}>{media.kind === "COVER" ? "Capa" : "Imagem"} {index + 1}</option>)}</select></label>}
        <label>Motivo<select value={reason} onChange={(event) => { setReason(event.target.value as ReportReason); setDuplicateTarget(null); }} required>{reasons.filter((option) => targetType === "ITEM" || option.value !== "DUPLICATE").map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
        {targetType === "ITEM" && reason === "DUPLICATE" && <section className="duplicate-picker"><label>Outro título duplicado<div className="target-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void searchDuplicate(); } }} placeholder="Busque o outro título…" /><button type="button" onClick={() => void searchDuplicate()} disabled={searching}>{searching ? <LoaderCircle className="spin" /> : "Buscar"}</button></div></label>{duplicateTarget && <div className="selected-duplicate"><strong>{duplicateTarget.title}</strong><button type="button" onClick={() => setDuplicateTarget(null)}>Trocar</button></div>}{!duplicateTarget && !!results.length && <div className="target-results">{results.map((candidate) => <button type="button" onClick={() => { setDuplicateTarget(candidate); setResults([]); }} key={candidate.id}><span>{typeLabels[candidate.type]}</span><strong>{candidate.title}</strong><ArrowRight /></button>)}</div>}</section>}
        <label>Descrição do problema<textarea name="description" required maxLength={1000} placeholder="Explique de forma objetiva o que precisa ser analisado…" /></label>
        {error && <p className="form-message form-message--error" role="alert">{error}</p>}
        <footer><Link href={`/catalog/${item.slug}`}>Cancelar</Link><button className="button-primary" type="submit" disabled={pending || (reason === "DUPLICATE" && !duplicateTarget)}>{pending ? <><LoaderCircle className="spin" /> Enviando…</> : <><Flag /> Enviar denúncia</>}</button></footer>
      </form>
    </div>
  );
}
