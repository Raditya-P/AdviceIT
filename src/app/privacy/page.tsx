import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Privacy and consent" };

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="prose-sm mx-auto max-w-2xl space-y-4 px-4 py-12">
          <h1 className="text-3xl font-semibold tracking-tight">Privacy and consent</h1>
          <p className="text-muted-foreground">
            AdviceIT is a research instrument run as a pilot study to develop the instrument itself. It is not a
            financial service, and nothing on this site is financial advice.
          </p>
          <h2 className="text-xl font-semibold">What is collected</h2>
          <p className="text-muted-foreground">
            Only what you enter during a study session: your answers to the three financial-knowledge questions, the
            hypothetical cases you saw, the recommendation and explanation shown, your trust ratings and decisions, the
            optional free-text answers, and timing. Everything is stored under a random participant ID shown to you at
            the start and the end of the session.
          </p>
          <h2 className="text-xl font-semibold">What is not collected</h2>
          <p className="text-muted-foreground">
            No name, no email, no account data, no IP-based profile, no advertising or analytics trackers. The
            conversational explainer runs entirely in your browser, so what you type to it never reaches a server. The
            try-mode advisor pages do not record anything at all.
          </p>
          <h2 className="text-xl font-semibold">Your rights</h2>
          <p className="text-muted-foreground">
            You can stop a session at any time by closing the page. You can have your data deleted by contacting the
            researcher and quoting your participant ID. Data from this pilot is used to develop and validate the
            instrument, and will not be used in a publication before a formal ethics review.
          </p>
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="text-muted-foreground">Raditya Pratama · radityapratama2077@gmail.com</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
