"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Boxes, Building2, FolderTree, LoaderCircle, Tags, UsersRound } from "lucide-react";
import type { Paginated } from "@/lib/admin-types";

const resources = [
  { key: "systems", label: "Sistemas", icon: Boxes, href: "/admin/catalog/systems", active: true },
  { key: "items", label: "Itens", icon: BookOpen, href: "/admin/catalog/items", active: true },
  { key: "publishers", label: "Editoras", icon: Building2, href: "/admin/catalog/publishers", active: true },
  { key: "creators", label: "Criadores", icon: UsersRound, href: "/admin/catalog/creators", active: true },
  { key: "categories", label: "Categorias", icon: FolderTree, href: "/admin/catalog/categories", active: true },
  { key: "tags", label: "Tags", icon: Tags, href: "/admin/catalog/tags", active: true },
] as const;

export function AdminDashboard() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    Promise.all(resources.map(async ({ key }) => {
      const response = await fetch(`/api/admin/catalog/${key}?page=1&limit=1`, { cache: "no-store", signal: controller.signal });
      const body = await response.json() as Paginated<unknown> & { message?: string | string[] };
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Não foi possível consultar o catálogo.");
      return [key, body.meta.total] as const;
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
        <div><span>CP5</span><p className="panel-eyebrow">Administração editorial</p><h2>Fundação administrativa ativa</h2><p>O shell, a autorização e a gestão de sistemas já usam os contratos reais da API. Os demais módulos serão conectados sobre esta mesma base.</p></div>
        <ol><li className="done">Acesso e sessão ADMIN</li><li className="done">Dashboard editorial</li><li className="done">Sistemas e cadastros auxiliares</li><li className="done">Editor principal de itens</li><li>Relações, edições e mídias</li></ol>
      </section>
    </div>
  );
}
