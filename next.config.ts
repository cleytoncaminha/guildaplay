import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  async redirects() {
    return [
      { source: "/biblioteca", destination: "/library", permanent: true },
      { source: "/cadastro", destination: "/register", permanent: true },
      { source: "/catalogo/:slug/avaliacoes", destination: "/catalog/:slug/reviews", permanent: true },
      { source: "/catalogo/:slug", destination: "/catalog/:slug", permanent: true },
      { source: "/catalogo", destination: "/catalog", permanent: true },
      { source: "/colecoes/:collectionId", destination: "/collections/:collectionId", permanent: true },
      { source: "/conta/perfil", destination: "/account/profile", permanent: true },
      { source: "/entrar", destination: "/login", permanent: true },
      { source: "/listas/:slug", destination: "/lists/:slug", permanent: true },
      { source: "/listas", destination: "/lists", permanent: true },
      { source: "/minhas-avaliacoes", destination: "/my-reviews", permanent: true },
      { source: "/minhas-colecoes/:collectionId", destination: "/my-collections/:collectionId", permanent: true },
      { source: "/minhas-colecoes", destination: "/my-collections", permanent: true },
      { source: "/recuperar-senha", destination: "/forgot-password", permanent: true },
      { source: "/redefinir-senha", destination: "/reset-password", permanent: true },
      { source: "/verificar-email", destination: "/verify-email", permanent: true },
    ];
  },
};

export default nextConfig;
