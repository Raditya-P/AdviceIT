import { DesignContent } from "./design-content";
import { localTitle } from "@/lib/locale-server";

export async function generateMetadata() {
  return {
    title: await localTitle("Study design", "Rancangan studi"),
    description: "The study design stated publicly: five explanation conditions, eight cases with deliberately flawed advice, how decisions are scored, the hypotheses and the analysis plan.",
  };
}

export default function DesignPage() {
  return <DesignContent />;
}
