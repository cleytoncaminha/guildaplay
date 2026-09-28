"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Flag, LoaderCircle, MessageSquareQuote, Send, ShieldCheck, X } from "lucide-react";
import type { ApiFailure } from "@/lib/auth-types";
import type { AdminReport, AdminReview, AdminSubmission, Paginated } from "@/lib/admin-types";

type QueueKind = "submissions" | "reports" | "reviews";
type ActionState = { id: string; action: string } | null;

const queueConfig = {
  submissions: { title: "Contribuições", eyebrow: "Moderação editorial", description: "Revise sugestões da comunidade antes que alterem a base editorial.", icon: ShieldCheck },
  reports: { title: "Denúncias", eyebrow: "Moderação editorial", description: "Avalie problemas apontados pela comunidade e registre a decisão tomada.", icon: Flag },
  reviews: { title: "Avaliações", eyebrow: "Moderação editorial", description: "Publique ou rejeite avaliações mantendo o histórico da decisão.", icon: MessageSquareQuote },
} as const;

function errorMessage(body: ApiFailure, fallback: string) { return Array.isArray(body.message) ? body.message.join(" ") : body.message ?? fallback; }
function dateLabel(value: string) { return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }); }
function json(value: unknown) { return JSON.stringify(value, null, 2); }

export function AdminModerationQueue({ kind }: { kind: QueueKind }) {
  const config = queueConfig[kind];
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [action, setAction] = useState<ActionState>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = kind === "reviews" ? `?page=${page}&limit=20` : "";
      const response = await fetch(`/api/admin/catalog/${kind}/pending${query}`, { cache: "no-store" });
      const body = await response.json() as (Paginated<AdminReview> | { data: AdminSubmission[] | AdminReport[] }) & ApiFailure;
      if (!response.ok) throw new Error(errorMessage(body, "Não foi possível carregar a fila."));
      if (kind === "submissions") { setSubmissions((body as { data: AdminSubmission[] }).data); setTotal((body as { data: AdminSubmission[] }).data.length); }
      if (kind === "reports") { setReports((body as { data: AdminReport[] }).data); setTotal((body as { data: AdminReport[] }).data.length); }
      if (kind === "reviews") { const result = body as Paginated<AdminReview>; setReviews(result.data); setTotal(result.meta.total); setPages(Math.max(1, result.meta.totalPages)); }
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "Não foi possível carregar a fila."); }
    finally { setLoading(false); }
  }, [kind, page]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  async function decide(id: string, path: string, body: unknown) {
    setLoading(true); setNotice("");
    try {
      const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json() as ApiFailure;
      if (!response.ok) throw new Error(errorMessage(result, "Não foi possível registrar a decisão."));
      setAction(null); await load(); setNotice("Decisão registrada e fila atualizada.");
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "Não foi possível registrar a decisão."); }
    finally { setLoading(false); }
  }

  const Icon = config.icon;
  return <div className="admin-page">
    <header className="admin-page__header"><div><p className="panel-eyebrow">{config.eyebrow}</p><h1>{config.title}</h1><p>{config.description}</p></div><div className="admin-queue-count"><Icon /><strong>{loading ? <LoaderCircle className="spin" /> : total}</strong><span>pendentes</span></div></header>
    {notice && <p className={`admin-notice ${notice.includes("registrada") ? "admin-notice--success" : "admin-notice--error"}`} role="status">{notice}</p>}
    <section className="admin-moderation-list">
      {loading && !submissions.length && !reports.length && !reviews.length ? <div className="admin-list-loading"><LoaderCircle className="spin" /> Carregando fila…</div> : kind === "submissions" ? <SubmissionRows rows={submissions} action={action} onAction={setAction} onDecide={decide} /> : kind === "reports" ? <ReportRows rows={reports} action={action} onAction={setAction} onDecide={decide} /> : <ReviewRows rows={reviews} action={action} onAction={setAction} onDecide={decide} />}
    </section>
    {kind === "reviews" && <footer className="admin-pagination"><button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || loading}><ChevronLeft /> Anterior</button><span>Página {page} de {pages}</span><button onClick={() => setPage((value) => Math.min(pages, value + 1))} disabled={page >= pages || loading}>Próxima <ChevronRight /></button></footer>}
  </div>;
}

function EmptyQueue({ text }: { text: string }) { return <div className="admin-empty"><span className="admin-empty__icon"><Check /></span><h2>Fila limpa</h2><p>{text}</p></div>; }

function SubmissionRows({ rows, action, onAction, onDecide }: { rows: AdminSubmission[]; action: ActionState; onAction: (state: ActionState) => void; onDecide: (id: string, path: string, body: unknown) => Promise<void> }) {
  if (!rows.length) return <EmptyQueue text="Não há contribuições aguardando análise." />;
  return <div className="admin-moderation-grid">{rows.map((row) => <article className="admin-moderation-card" key={row.id}><div className="admin-moderation-card__top"><span className="admin-status admin-status--draft">{row.type === "CREATE_ITEM" ? "Novo item" : "Alteração"}</span><time dateTime={row.createdAt}>{dateLabel(row.createdAt)}</time></div><h2>{row.catalogItemId ? `Item ${row.catalogItemId}` : "Sugestão de novo item"}</h2><p className="admin-moderation-meta">Enviado por <code>{row.submittedByUserId}</code></p><details><summary>Ver proposta</summary><pre>{json(row.payload)}</pre></details>{action?.id === row.id && <DecisionBox label={action.action === "approve" ? "Aprovar contribuição" : "Rejeitar contribuição"} requireReason={action.action === "reject"} onCancel={() => onAction(null)} onSubmit={(reason) => onDecide(row.id, `/api/admin/catalog/submissions/${row.id}/${action.action}`, { reason: reason || undefined })} />}{!action || action.id !== row.id ? <div className="admin-moderation-actions"><button className="admin-primary-button" onClick={() => onAction({ id: row.id, action: "approve" })}><Check /> Aprovar</button><button className="admin-danger-button" onClick={() => onAction({ id: row.id, action: "reject" })}><X /> Rejeitar</button></div> : null}</article>)}</div>;
}

function ReportRows({ rows, action, onAction, onDecide }: { rows: AdminReport[]; action: ActionState; onAction: (state: ActionState) => void; onDecide: (id: string, path: string, body: unknown) => Promise<void> }) {
  if (!rows.length) return <EmptyQueue text="Não há denúncias aguardando análise." />;
  return <div className="admin-moderation-grid">{rows.map((row) => <article className="admin-moderation-card" key={row.id}><div className="admin-moderation-card__top"><span className="admin-status admin-status--draft">{row.reason}</span><time dateTime={row.createdAt}>{dateLabel(row.createdAt)}</time></div><h2>{row.targetType === "ITEM" ? "Item denunciado" : "Mídia denunciada"}</h2><p>{row.description}</p><dl className="admin-moderation-facts"><div><dt>Denunciante</dt><dd><code>{row.reportedByUserId}</code></dd></div><div><dt>Alvo</dt><dd><code>{row.catalogItemId ?? row.mediaAssetId}</code></dd></div>{row.duplicateOfCatalogItemId && <div><dt>Duplicado de</dt><dd><code>{row.duplicateOfCatalogItemId}</code></dd></div>}</dl>{action?.id === row.id && <ReportDecisionBox onCancel={() => onAction(null)} onSubmit={(status, note) => onDecide(row.id, `/api/admin/catalog/reports/${row.id}/resolve`, { status, note: note || undefined })} />}{!action || action.id !== row.id ? <div className="admin-moderation-actions"><button className="admin-primary-button" onClick={() => onAction({ id: row.id, action: "resolve" })}><Check /> Resolver</button><button className="admin-danger-button" onClick={() => onAction({ id: row.id, action: "dismiss" })}><X /> Descartar</button></div> : null}</article>)}</div>;
}

function ReviewRows({ rows, action, onAction, onDecide }: { rows: AdminReview[]; action: ActionState; onAction: (state: ActionState) => void; onDecide: (id: string, path: string, body: unknown) => Promise<void> }) {
  if (!rows.length) return <EmptyQueue text="Não há avaliações aguardando análise." />;
  return <div className="admin-moderation-grid">{rows.map((row) => <article className="admin-moderation-card" key={row.id}><div className="admin-moderation-card__top"><span className="admin-rating">{row.rating}/10</span><time dateTime={row.createdAt}>{dateLabel(row.createdAt)}</time></div><h2>{row.catalogItem.title}</h2><p className="admin-moderation-meta">Por {row.author.name} · <code>{row.catalogItem.slug}</code></p><blockquote>{row.content || "Sem comentário escrito."}</blockquote>{action?.id === row.id && <DecisionBox label={action.action === "publish" ? "Publicar avaliação" : "Rejeitar avaliação"} requireReason={action.action === "reject"} onCancel={() => onAction(null)} onSubmit={(reason) => onDecide(row.id, `/api/admin/catalog/reviews/${row.id}/moderate`, { status: action.action === "publish" ? "PUBLISHED" : "REJECTED", reason: reason || undefined })} />}{!action || action.id !== row.id ? <div className="admin-moderation-actions"><button className="admin-primary-button" onClick={() => onAction({ id: row.id, action: "publish" })}><Send /> Publicar</button><button className="admin-danger-button" onClick={() => onAction({ id: row.id, action: "reject" })}><X /> Rejeitar</button></div> : null}</article>)}</div>;
}

function DecisionBox({ label, requireReason, onCancel, onSubmit }: { label: string; requireReason: boolean; onCancel: () => void; onSubmit: (reason: string) => Promise<void> }) {
  const [reason, setReason] = useState(""); const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPending(true); try { await onSubmit(reason.trim()); } finally { setPending(false); } }
  return <form className="admin-decision-box" onSubmit={submit}><label>Motivo {requireReason ? "(obrigatório para rejeitar)" : "(opcional)"}<textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} rows={3} required={requireReason} placeholder={requireReason ? "Explique o motivo da rejeição…" : "Contexto para o histórico…"} /></label><div><button type="button" className="admin-quiet-button" onClick={onCancel} disabled={pending}>Cancelar</button><button className="admin-primary-button" disabled={pending || (requireReason && !reason.trim())}>{pending ? <LoaderCircle className="spin" /> : <Check />} {label}</button></div></form>;
}

function ReportDecisionBox({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (status: "RESOLVED" | "DISMISSED", note: string) => Promise<void> }) {
  const [status, setStatus] = useState<"RESOLVED" | "DISMISSED">("RESOLVED"); const [note, setNote] = useState(""); const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPending(true); try { await onSubmit(status, note.trim()); } finally { setPending(false); } }
  return <form className="admin-decision-box" onSubmit={submit}><label>Decisão<select value={status} onChange={(event) => setStatus(event.target.value as "RESOLVED" | "DISMISSED")}><option value="RESOLVED">Resolver denúncia</option><option value="DISMISSED">Descartar denúncia</option></select></label><label>Nota da resolução<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} rows={3} required placeholder="Registre o contexto da decisão…" /></label><div><button type="button" className="admin-quiet-button" onClick={onCancel} disabled={pending}>Cancelar</button><button className="admin-primary-button" disabled={pending || !note.trim()}>{pending ? <LoaderCircle className="spin" /> : <Check />} Registrar decisão</button></div></form>;
}
