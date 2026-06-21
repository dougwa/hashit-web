import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

// Legacy route — the search experience is now part of /explore. A bookmarked
// query is carried over as a global (whole-index) search.
export default async function SearchRedirect({ searchParams }: Props) {
  const { q } = await searchParams;
  if (q) {
    const sp = new URLSearchParams({ q, scope: "global" });
    redirect(`/explore?${sp}`);
  }
  redirect("/explore");
}
