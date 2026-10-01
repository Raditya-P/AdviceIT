import type { NextConfig } from "next";

/* Response headers that cost nothing and close common gaps. Framing is
   deliberately left open: a survey platform may embed the study in an
   iframe. A Content-Security-Policy is left out too, because the
   conversational explainer fetches model weights and WebAssembly from
   several hosts that would all have to be listed and kept current. */
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
