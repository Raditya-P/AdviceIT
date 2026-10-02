import { PrivacyContent } from "./privacy-content";
import { localTitle } from "@/lib/locale-server";

export async function generateMetadata() {
  return {
    title: await localTitle("Privacy and consent", "Privasi dan persetujuan"),
    description: "What a study session records, what it never collects, and how to have your data deleted.",
  };
}

export default function PrivacyPage() {
  return <PrivacyContent />;
}
