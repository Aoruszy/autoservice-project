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
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 md:px-6">
      <AuthPanel />
    </div>
  );
}
