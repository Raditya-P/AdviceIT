import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Playground } from "@/components/advisor/playground";

export function generateStaticParams() {
  return [{ id: "ml" }, { id: "logit" }];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: id === "ml" ? "AI advisor" : "Interpretable rule-based advisor" };
}

export default async function AdvisorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ researcher?: string }>;
}) {
  const { id } = await params;
  if (id !== "ml" && id !== "logit") notFound();
  const sp = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Playground advisorId={id} researcher={sp.researcher === "1"} />
      </main>
      <SiteFooter />
    </>
  );
}
