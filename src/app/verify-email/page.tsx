import { redirect } from "next/navigation";

/** Legacy route: email verification is handled by Clerk during sign-up / sign-in. */
export default function VerifyEmailRedirectPage() {
  redirect("/login?notice=verify");
}
