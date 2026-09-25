import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Informe um e-mail válido.").max(255),
  password: z.string().min(1, "Informe sua senha.").max(128),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe pelo menos 2 caracteres.").max(120),
  email: z.email("Informe um e-mail válido.").max(255),
  password: z.string().min(10, "A senha precisa ter pelo menos 10 caracteres.").max(128),
});

export const emailSchema = z.object({ email: z.email("Informe um e-mail válido.").max(255) });
export const tokenSchema = z.object({ token: z.string().min(1, "Token não informado.").max(512) });
export const resetPasswordSchema = tokenSchema.extend({ password: z.string().min(10, "A senha precisa ter pelo menos 10 caracteres.").max(128) });

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Informe pelo menos 2 caracteres.").max(120),
  timezone: z.string().trim().min(1, "Informe o fuso horário.").max(80),
  country: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "Use o código do país com duas letras.").optional().or(z.literal("")),
});
