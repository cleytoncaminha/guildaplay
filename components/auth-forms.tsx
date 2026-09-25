"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, LoaderCircle, Mail, UserRound } from "lucide-react";
import type { ApiEnvelope, ApiFailure, UserProfile } from "@/lib/auth-types";

type FormMessage = { type: "error" | "success"; text: string } | null;

async function post<T>(path: string, data: unknown) {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  const body = await response.json() as ApiEnvelope<T> & ApiFailure & { fields?: Record<string, string> };
  if (!response.ok) {
    const message = Array.isArray(body.message) ? body.message.join(" ") : body.message;
    throw new Error(message ?? "Não foi possível concluir a solicitação.");
  }
  return { body, response };
}

function SubmitButton({ pending, idle, busy }: { pending: boolean; idle: string; busy: string }) {
  return <button className="auth-submit" type="submit" disabled={pending}>{pending ? <><LoaderCircle className="spin" />{busy}</> : <>{idle}<ArrowRight /></>}</button>;
}

function PasswordInput({ id = "password", label = "Senha", autoComplete = "current-password" }: { id?: string; label?: string; autoComplete?: string }) {
  const [visible, setVisible] = useState(false);
  return <label className="auth-field"><span>{label}</span><div><KeyRound /><input id={id} name={id} type={visible ? "text" : "password"} minLength={10} maxLength={128} autoComplete={autoComplete} required /><button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? "Ocultar senha" : "Mostrar senha"}>{visible ? <EyeOff /> : <Eye />}</button></div></label>;
}

export function LoginForm({ returnTo = "/" }: { returnTo?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<FormMessage>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage(null);
    const data = new FormData(event.currentTarget);
    try {
      await post("/api/auth/login", { email: data.get("email"), password: data.get("password") });
      window.dispatchEvent(new Event("auth-changed"));
      const destination = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";
      router.push(destination as Route);
      router.refresh();
    } catch (error) { setMessage({ type: "error", text: error instanceof Error ? error.message : "Não foi possível entrar." }); }
    finally { setPending(false); }
  }

  return <div className="auth-card"><div className="auth-card__heading"><p className="panel-eyebrow">Bem-vindo de volta</p><h2>Entre na Guilda</h2><p>Acesse sua biblioteca, coleções e avaliações.</p></div><form onSubmit={submit}><label className="auth-field"><span>E-mail</span><div><Mail /><input name="email" type="email" autoComplete="email" maxLength={255} required /></div></label><PasswordInput />{message && <p className={`form-message form-message--${message.type}`} role="alert">{message.text}</p>}<div className="auth-form-links"><Link href="/forgot-password">Esqueci minha senha</Link></div><SubmitButton pending={pending} idle="Entrar" busy="Entrando…" /></form><p className="auth-card__footer">Ainda não faz parte? <Link href="/register">Criar uma conta</Link></p></div>;
}

export function RegisterForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<FormMessage>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage(null);
    const data = new FormData(event.currentTarget);
    if (data.get("password") !== data.get("confirmPassword")) { setMessage({ type: "error", text: "As senhas não coincidem." }); setPending(false); return; }
    try {
      const { response } = await post("/api/auth/register", { name: data.get("name"), email: data.get("email"), password: data.get("password") });
      const params = new URLSearchParams({ email: String(data.get("email")), registered: "1" });
      const devToken = response.headers.get("x-development-verification-token");
      if (devToken) params.set("token", devToken);
      router.push(`/verify-email?${params}`);
    } catch (error) { setMessage({ type: "error", text: error instanceof Error ? error.message : "Não foi possível criar a conta." }); }
    finally { setPending(false); }
  }

  return <div className="auth-card"><div className="auth-card__heading"><p className="panel-eyebrow">Novo aventureiro</p><h2>Crie sua conta</h2><p>Comece a organizar seus próximos mundos.</p></div><form onSubmit={submit}><label className="auth-field"><span>Nome</span><div><UserRound /><input name="name" autoComplete="name" minLength={2} maxLength={120} required /></div></label><label className="auth-field"><span>E-mail</span><div><Mail /><input name="email" type="email" autoComplete="email" maxLength={255} required /></div></label><PasswordInput autoComplete="new-password" /><PasswordInput id="confirmPassword" label="Confirmar senha" autoComplete="new-password" />{message && <p className={`form-message form-message--${message.type}`} role="alert">{message.text}</p>}<SubmitButton pending={pending} idle="Criar conta" busy="Criando conta…" /></form><p className="auth-card__footer">Já possui uma conta? <Link href="/login">Entrar</Link></p></div>;
}

export function VerifyEmailForm({ initialEmail = "", initialToken = "", registered = false }: { initialEmail?: string; initialToken?: string; registered?: boolean }) {
  const [email, setEmail] = useState(initialEmail);
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<FormMessage>(registered ? { type: "success", text: "Conta criada. Agora confirme seu e-mail." } : null);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage(null);
    const data = new FormData(event.currentTarget);
    try { await post("/api/auth/verify-email", { token: data.get("token") }); setMessage({ type: "success", text: "E-mail confirmado. Você já pode entrar." }); }
    catch (error) { setMessage({ type: "error", text: error instanceof Error ? error.message : "Token inválido." }); }
    finally { setPending(false); }
  }

  async function resend() {
    if (!email) { setMessage({ type: "error", text: "Informe o e-mail usado no cadastro." }); return; }
    setResending(true); setMessage(null);
    try { const { response } = await post("/api/auth/resend-verification", { email }); const token = response.headers.get("x-development-verification-token"); setMessage({ type: "success", text: token ? `Novo token de desenvolvimento: ${token}` : "Se a conta existir, enviaremos uma nova verificação." }); }
    catch (error) { setMessage({ type: "error", text: error instanceof Error ? error.message : "Não foi possível reenviar." }); }
    finally { setResending(false); }
  }

  return <div className="auth-card"><div className="auth-card__heading"><p className="panel-eyebrow">Confirmação</p><h2>Verifique seu e-mail</h2><p>Use o token recebido para ativar sua conta.</p></div><form onSubmit={verify}><label className="auth-field"><span>E-mail</span><div><Mail /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={255} required /></div></label><label className="auth-field"><span>Token de verificação</span><div><KeyRound /><input name="token" defaultValue={initialToken} maxLength={512} required /></div></label>{message && <p className={`form-message form-message--${message.type}`} role="status">{message.text}</p>}<SubmitButton pending={pending} idle="Confirmar e-mail" busy="Confirmando…" /></form><div className="auth-secondary-action"><button onClick={resend} disabled={resending}>{resending ? "Reenviando…" : "Reenviar verificação"}</button><Link href="/login">Voltar para o login</Link></div></div>;
}

export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<FormMessage>(null);
  const [devToken, setDevToken] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPending(true); setMessage(null); const data = new FormData(event.currentTarget); try { const { body, response } = await post<{ message: string }>("/api/auth/forgot-password", { email: data.get("email") }); setDevToken(response.headers.get("x-development-reset-token") ?? ""); setMessage({ type: "success", text: body.data.message }); } catch (error) { setMessage({ type: "error", text: error instanceof Error ? error.message : "Não foi possível solicitar a recuperação." }); } finally { setPending(false); } }
  return <div className="auth-card"><div className="auth-card__heading"><p className="panel-eyebrow">Recuperação</p><h2>Recupere sua senha</h2><p>Enviaremos as instruções para o e-mail cadastrado.</p></div><form onSubmit={submit}><label className="auth-field"><span>E-mail</span><div><Mail /><input name="email" type="email" autoComplete="email" maxLength={255} required /></div></label>{message && <p className={`form-message form-message--${message.type}`} role="status">{message.text}</p>}{devToken && <Link className="development-link" href={`/reset-password?token=${encodeURIComponent(devToken)}`}>Usar token de desenvolvimento <ArrowRight /></Link>}<SubmitButton pending={pending} idle="Enviar instruções" busy="Enviando…" /></form><p className="auth-card__footer"><Link href="/login">Voltar para o login</Link></p></div>;
}

export function ResetPasswordForm({ initialToken = "" }: { initialToken?: string }) {
  const [pending, setPending] = useState(false); const [message, setMessage] = useState<FormMessage>(null); const [complete, setComplete] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPending(true); setMessage(null); const data = new FormData(event.currentTarget); if (data.get("password") !== data.get("confirmPassword")) { setMessage({ type: "error", text: "As senhas não coincidem." }); setPending(false); return; } try { await post("/api/auth/reset-password", { token: data.get("token"), password: data.get("password") }); setComplete(true); setMessage({ type: "success", text: "Senha redefinida. Todas as sessões anteriores foram encerradas." }); } catch (error) { setMessage({ type: "error", text: error instanceof Error ? error.message : "Não foi possível redefinir a senha." }); } finally { setPending(false); } }
  return <div className="auth-card"><div className="auth-card__heading"><p className="panel-eyebrow">Nova credencial</p><h2>Defina uma nova senha</h2><p>O token será utilizado apenas nesta alteração.</p></div>{complete ? <div className="auth-complete"><CheckCircle2 /><p>{message?.text}</p><Link className="auth-submit" href="/login">Entrar com a nova senha <ArrowRight /></Link></div> : <form onSubmit={submit}><label className="auth-field"><span>Token de recuperação</span><div><KeyRound /><input name="token" defaultValue={initialToken} maxLength={512} required /></div></label><PasswordInput autoComplete="new-password" /><PasswordInput id="confirmPassword" label="Confirmar nova senha" autoComplete="new-password" />{message && <p className={`form-message form-message--${message.type}`} role="alert">{message.text}</p>}<SubmitButton pending={pending} idle="Redefinir senha" busy="Redefinindo…" /></form>}</div>;
}

export function ProfileForm() {
  const router = useRouter(); const [profile, setProfile] = useState<UserProfile | null>(null); const [loading, setLoading] = useState(true); const [pending, setPending] = useState(false); const [message, setMessage] = useState<FormMessage>(null);
  useEffect(() => { fetch("/api/profile", { cache: "no-store" }).then(async (response) => { if (response.status === 401) { router.replace("/login?returnTo=/account/profile"); return; } const body = await response.json() as ApiEnvelope<UserProfile> & ApiFailure; if (!response.ok) throw new Error(typeof body.message === "string" ? body.message : "Não foi possível carregar o perfil."); setProfile(body.data); }).catch((error) => setMessage({ type: "error", text: error.message })).finally(() => setLoading(false)); }, [router]);
  async function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPending(true); setMessage(null); const data = new FormData(event.currentTarget); try { const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: data.get("name"), timezone: data.get("timezone"), country: data.get("country") }) }); const body = await response.json() as ApiEnvelope<UserProfile> & ApiFailure; if (!response.ok) throw new Error(typeof body.message === "string" ? body.message : "Não foi possível salvar."); setProfile(body.data); setMessage({ type: "success", text: "Perfil atualizado." }); window.dispatchEvent(new Event("auth-changed")); } catch (error) { setMessage({ type: "error", text: error instanceof Error ? error.message : "Não foi possível salvar." }); } finally { setPending(false); } }
  async function logoutAll() { setPending(true); try { await fetch("/api/auth/logout-all", { method: "POST" }); router.replace("/"); router.refresh(); } finally { setPending(false); } }
  if (loading) return <div className="profile-loading"><LoaderCircle className="spin" /> Carregando seu perfil…</div>;
  if (!profile) return <div className="auth-card"><p className="form-message form-message--error">{message?.text ?? "Perfil indisponível."}</p></div>;
  return <div className="profile-grid"><section className="profile-summary"><div className="profile-avatar" style={profile.avatar ? { backgroundImage: `url("${profile.avatar.url}")` } : undefined}>{!profile.avatar && profile.name.charAt(0).toUpperCase()}</div><h1>{profile.name}</h1><p>{profile.email}</p><span className={profile.emailVerified ? "verified" : "pending"}>{profile.emailVerified ? "E-mail verificado" : "E-mail pendente"}</span><dl><div><dt>Membro desde</dt><dd>{new Date(profile.createdAt).toLocaleDateString("pt-BR")}</dd></div><div><dt>Permissões</dt><dd>{profile.roles.join(", ")}</dd></div></dl></section><section className="profile-form-panel"><p className="panel-eyebrow">Dados da conta</p><h2>Seu perfil</h2><form onSubmit={save}><label className="auth-field"><span>Nome</span><div><UserRound /><input name="name" defaultValue={profile.name} minLength={2} maxLength={120} required /></div></label><label className="auth-field"><span>Fuso horário</span><div><input name="timezone" defaultValue={profile.timezone} maxLength={80} required /></div></label><label className="auth-field"><span>País</span><div><input name="country" defaultValue={profile.country ?? ""} minLength={2} maxLength={2} placeholder="BR" /></div></label>{message && <p className={`form-message form-message--${message.type}`} role="status">{message.text}</p>}<SubmitButton pending={pending} idle="Salvar alterações" busy="Salvando…" /></form><div className="profile-danger"><div><strong>Encerrar todas as sessões</strong><p>Desconecta sua conta de todos os dispositivos.</p></div><button onClick={logoutAll} disabled={pending}>Sair de todos</button></div></section></div>;
}
