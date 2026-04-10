import { redirect } from "next/navigation";

/** Legacy route: account recovery is handled by Clerk (Forgot password on Sign in). */
export default function PasswordRecoveryRedirectPage() {
  redirect("/login?notice=password");
}
