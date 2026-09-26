import type { Metadata } from "next";
import { AdminSystems } from "@/components/admin-systems";

export const metadata: Metadata = { title: "Sistemas | Administração" };

export default function AdminSystemsPage() {
  return <AdminSystems />;
}

