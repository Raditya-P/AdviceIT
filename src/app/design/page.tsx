import { DesignContent } from "./design-content";
import { localTitle } from "@/lib/locale-server";

export async function generateMetadata() {
  return {
    title: await localTitle("Study design", "Rancangan studi"),
    description: "The study design stated publicly: two factors, the nine cells of the fractional design, the measures and the analysis plan.",
  };
}

export default function DesignPage() {
  return <DesignContent />;
}
