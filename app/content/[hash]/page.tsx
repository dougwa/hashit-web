import { hashit } from "@/lib/hashit";
import { notFound } from "next/navigation";
import ContentDetail from "@/components/ContentDetail";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ hash: string }>;
}

export default async function ContentPage({ params }: Props) {
  const { hash } = await params;
  const { data, error } = await hashit.GET("/v1/content/{hash}/meta", {
    params: { path: { hash } },
  });

  if (error || !data) notFound();

  return <ContentDetail detail={data} />;
}
