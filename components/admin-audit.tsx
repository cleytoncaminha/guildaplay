"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, LoaderCircle, ScrollText, Search } from "lucide-react";
import type { ApiFailure } from "@/lib/auth-types";
import type { AuditLog, Paginated } from "@/lib/admin-types";

function errorMessage(body: ApiFailure, fallback: string) { return Array.isArray(body.message) ? body.message.join(" ") : body.message ?? fallback; }
function dateLabel(value: string) { return new Date(value).toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" }); }

export function AdminAudit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [eventType, setEventType] = useState("");
  const [actorUserId, setActorUserId] = useState("");
  const [filters, setFilters] = useState({ eventType: "", actorUserId: "" });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const params = new URLSearchParams({ page: String(page), limit: "30" });
    if (filters.eventType) params.set("eventType", filters.eventType);
    if (filters.actorUserId) params.set("actorUserId", filters.actorUserId);
    try {
      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`, { cache: "no-store" });
      const body = await response.json() as Paginated<AuditLog> & ApiFailure;
      if (!response.ok) throw new Error(errorMessage(body, "Não foi possível carregar a auditoria."));
      setLogs(body.data); setTotal(body.meta.total); setPages(Math.max(1, body.meta.totalPages));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível carregar a auditoria."); }
    finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPage(1); setFilters({ eventType: eventType.trim(), actorUserId: actorUserId.trim() }); }

  return <div className="admin-page"><header className="admin-page__header"><div><p className="panel-eyebrow">Rastreabilidade</p><h1>Auditoria</h1><p>Consulte as ações administrativas e o contexto sanitizado de cada evento.</p></div><div className="admin-queue-count"><ScrollText /><strong>{loading ? <LoaderCircle className="spin" /> : total}</strong><span>eventos</span></div></header><form className="admin-audit-filters" onSubmit={submit}><label><span>Tipo de evento</span><input value={eventType} onChange={(event) => setEventType(event.target.value)} placeholder="CATALOG_…" /></label><label><span>ID do responsável</span><input value={actorUserId} onChange={(event) => setActorUserId(event.target.value)} placeholder="UUID" /></label><button className="admin-primary-button"><Search /> Filtrar</button></form>{error && <p className="admin-notice admin-notice--error">{error}</p>}<section className="admin-list-card"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Evento</th><th>Responsável</th><th>Metadados</th><th>Data</th></tr></thead><tbody>{loading ? <tr><td colSpan={4}><div className="admin-list-loading"><LoaderCircle className="spin" /> Carregando…</div></td></tr> : logs.length ? logs.map((log) => <tr key={log.id}><td><strong className="admin-audit-event">{log.eventType}</strong><small>{log.id}</small></td><td><code>{log.actorUserId ?? "Sistema"}</code></td><td><pre className="admin-audit-metadata">{log.metadata ? JSON.stringify(log.metadata, null, 2) : "—"}</pre></td><td><time dateTime={log.createdAt}>{dateLabel(log.createdAt)}</time></td></tr>) : <tr><td colSpan={4}><div className="admin-empty admin-empty--compact"><span className="admin-empty__icon"><ScrollText /></span><h2>Nenhum evento encontrado</h2><p>Ajuste os filtros ou aguarde novas ações.</p></div></td></tr>}</tbody></table></div><footer className="admin-pagination"><button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || loading}><ChevronLeft /> Anterior</button><span>Página {page} de {pages}</span><button onClick={() => setPage((value) => Math.min(pages, value + 1))} disabled={page >= pages || loading}>Próxima <ChevronRight /></button></footer></section></div>;
}
