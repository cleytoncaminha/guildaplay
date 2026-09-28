"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Archive, BookOpen, Boxes, Building2, Flag, FolderTree, List, LoaderCircle, MessageSquareQuote, ScrollText, Tags, UsersRound } from "lucide-react";

const resources = [
  { key: "systems", label: "Sistemas", icon: Boxes, href: "/admin/catalog/systems", active: true },
  { key: "items", label: "Itens", icon: BookOpen, href: "/admin/catalog/items", active: true },
  { key: "publishers", label: "Editoras", icon: Building2, href: "/admin/catalog/publishers", active: true },
  { key: "creators", label: "Criadores", icon: UsersRound, href: "/admin/catalog/creators", active: true },
  { key: "categories", label: "Categorias", icon: FolderTree, href: "/admin/catalog/categories", active: true },
  { key: "tags", label: "Tags", icon: Tags, href: "/admin/catalog/tags", active: true },
  { key: "lists", label: "Listas temáticas", icon: List, href: "/admin/curated-lists", active: true },
  { key: "submissions", label: "Contribuições", icon: Archive, href: "/admin/moderation/submissions", active: true },
  { key: "reports", label: "Denúncias", icon: Flag, href: "/admin/moderation/reports", active: true },
  { key: "reviews", label: "Avaliações", icon: MessageSquareQuote, href: "/admin/moderation/reviews", active: true },
  { key: "audit", label: "Auditoria", icon: ScrollText, href: "/admin/audit", active: true },
] as const;

export function AdminDashboard() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    Promise.all(resources.map(async ({ key }) => {
      const endpoint = key === "audit" ? "/api/admin/audit-logs?page=1&limit=1" : key === "submissions" || key === "reports" ? `/api/admin/catalog/${key}/pending` : key === "reviews" ? "/api/admin/catalog/reviews/pending?page=1&limit=1" : `/api/admin/catalog/${key}?page=1&limit=1`;
      const response = await fetch(endpoint, { cache: "no-store", signal: controller.signal });
      const body = await response.json() as { data?: unknown; meta?: { total: number }; message?: string | string[] };
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Não foi possível consultar o catálogo.");
      return [key, body.meta?.total ?? (Array.isArray(body.data) ? body.data.length : 0)] as const;
    }))
      .then((entries) => setCounts(Object.fromEntries(entries)))
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "Não foi possível carregar os indicadores.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div><p className="panel-eyebrow">Catálogo editorial</p><h1>Painel administrativo</h1><p>Acompanhe a base editorial e publique conteúdo com segurança.</p></div>
      </header>
      {error && <p className="admin-notice admin-notice--error" role="alert">{error}</p>}
      <section className="admin-metrics" aria-label="Resumo do catálogo">
        {resources.map(({ key, label, icon: Icon, active, href }) => {
          const content = <><span><Icon /></span><div><strong>{loading ? <LoaderCircle className="spin" /> : counts[key] ?? "—"}</strong><p>{label}</p></div>{active && <small>Abrir gestão</small>}</>;
          return active && href ? <Link className="admin-metric admin-metric--active" href={href} key={key}>{content}</Link> : <article className="admin-metric" key={key}>{content}<small>Próxima etapa</small></article>;
        })}
      </section>
      <section className="admin-progress-card">
        <div><span>CP6</span><p className="panel-eyebrow">Curadoria e moderação</p><h2>Governança editorial ativa</h2><p>As filas administrativas, listas temáticas e decisões de publicação usam os contratos reais da API e deixam um histórico consultável.</p></div>
        <ol><li className="done">Acesso e sessão ADMIN</li><li className="done">Catálogo editorial</li><li className="done">Curadoria de listas</li><li className="done">Filas de moderação</li><li className="done">Auditoria de decisões</li></ol>
      </section>
    </div>
  );
}
