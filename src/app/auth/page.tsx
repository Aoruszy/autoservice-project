import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth-panel";
import { getCurrentUser } from "@/lib/auth";
import { roleHome } from "@/lib/utils";

export default async function AuthPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(roleHome(user.role));
  }

  return (
    <div className="page-shell">
      <AuthPanel />
    </div>
  );
}
