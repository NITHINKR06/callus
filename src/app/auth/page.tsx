import { redirect } from "next/navigation";

import { AuthForm } from "@/components/AuthForm";
import { auth } from "@/server/auth";

export default async function AuthPage() {
  const session = await auth();

  if (session) {
    redirect("/feed");
  }

  return <AuthForm />;
}

