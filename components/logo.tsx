import Link from "next/link";
import { Compass } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className={`brand ${compact ? "brand--compact" : ""}`} href="/" aria-label="Dados da Guilda — início">
      <Compass aria-hidden="true" />
      <span><strong>Dados da</strong> <em>Guilda</em></span>
    </Link>
  );
}
