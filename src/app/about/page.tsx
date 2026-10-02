import { AboutContent } from "./about-content";
import { localTitle } from "@/lib/locale-server";

export async function generateMetadata() {
  return {
    title: await localTitle("About", "Tentang"),
    description: "What AdviceIT is, the team behind it, and where researchers and reviewers should start.",
  };
}

export default function AboutPage() {
  return <AboutContent />;
}
