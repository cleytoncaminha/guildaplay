import { AdminCuratedListEditor } from "@/components/admin-curation";

export default async function CuratedListPage({ params }: PageProps<"/admin/curated-lists/[listId]">) {
  const { listId } = await params;
  return <AdminCuratedListEditor listId={listId} />;
}
