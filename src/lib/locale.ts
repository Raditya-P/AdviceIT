/* The locale type and the cookie that carries it, shared by server and
   client code. They live outside i18n.tsx on purpose: that file is a client
   module, and a server component that imports a value from a "use client"
   file gets a client reference, not the value. Imported from there, the
   cookie name the layout looked up was never "adviceit-lang", so every first
   paint was in English whatever the visitor had chosen. */
export type Locale = "en" | "id";
export const COOKIE = "adviceit-lang";
