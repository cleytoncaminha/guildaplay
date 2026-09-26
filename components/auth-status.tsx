"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookHeart, ChevronDown, FilePenLine, FolderHeart, LayoutDashboard, LogOut, MessageSquareText, UserRound } from "lucide-react";
import type { ApiEnvelope, AuthUser } from "@/lib/auth-types";

export function AuthStatus({ mobile = false }: { mobile?: boolean }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      if (!response.ok) { setUser(null); return; }
      const body = await response.json() as ApiEnvelope<AuthUser | null>;
      setUser(body.data);
    } catch { setUser(null); }
    finally { setReady(true); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    window.addEventListener("auth-changed", load);
    return () => { window.clearTimeout(timer); window.removeEventListener("auth-changed", load); };
  }, [load]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.dispatchEvent(new Event("auth-changed"));
    router.replace("/");
    router.refresh();
  }

  if (!ready) return <span className={`auth-status-skeleton ${mobile ? "auth-status-skeleton--mobile" : ""}`} aria-label="Consultando sessão" />;
  if (!user) return <Link className={mobile ? "mobile-login-link" : "header-login-link"} href="/login">Entrar</Link>;

  if (mobile) {
    return <span className="auth-status-mobile">{user.roles.includes("ADMIN") && <Link href="/admin">Administração</Link>}<Link href="/library">Minha biblioteca</Link><Link href="/my-collections">Minhas coleções</Link><Link href="/my-reviews">Minhas avaliações</Link><Link href="/contributions">Minhas contribuições</Link><Link href="/account/profile">Minha conta</Link><button className="mobile-logout" onClick={logout}>Sair</button></span>;
  }

  return (
    <details className="auth-status">
      <summary><span className="avatar">{user.name.charAt(0).toUpperCase()}</span><strong>{user.name.split(" ")[0]}</strong><ChevronDown /></summary>
      <div className="auth-status__menu">
        <div><span className="avatar">{user.name.charAt(0).toUpperCase()}</span><p><strong>{user.name}</strong><small>{user.email}</small></p></div>
        {user.roles.includes("ADMIN") && <Link href="/admin"><LayoutDashboard /> Administração</Link>}
        <Link href="/library"><BookHeart /> Minha biblioteca</Link>
        <Link href="/my-collections"><FolderHeart /> Minhas coleções</Link>
        <Link href="/my-reviews"><MessageSquareText /> Minhas avaliações</Link>
        <Link href="/contributions"><FilePenLine /> Minhas contribuições</Link>
        <Link href="/account/profile"><UserRound /> Minha conta</Link>
        <button onClick={logout}><LogOut /> Sair</button>
      </div>
    </details>
  );
}
