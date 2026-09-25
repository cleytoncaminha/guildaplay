export type UserRole = "USER" | "ADMIN";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  roles: UserRole[];
  gmProfile?: { id: string; displayName: string; status: string } | null;
};

export type UserProfile = AuthUser & {
  timezone: string;
  country: string | null;
  status: string;
  createdAt: string;
  avatar: { id: string; url: string } | null;
};

export type ApiEnvelope<T> = { data: T };
export type ApiFailure = { statusCode?: number; code?: string; message?: string | string[]; requestId?: string };
