import { AdminItemEditor } from "@/components/admin-items";
export default async function ItemPage({ params }: PageProps<"/admin/catalog/items/[itemId]">) { const { itemId } = await params; return <AdminItemEditor itemId={itemId} />; }
