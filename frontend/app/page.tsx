/**
 * Root page — redirects to /dashboard (authenticated) or /login (unauthenticated).
 */

import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/dashboard");
}
