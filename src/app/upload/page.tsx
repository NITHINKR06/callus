import { redirect } from "next/navigation";

import { Navbar } from "@/components/Navbar";
import { UploadForm } from "@/components/UploadForm";
import { auth } from "@/server/auth";

export default async function UploadPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth");
  }

  return (
    <>
      <Navbar />
      <UploadForm />
    </>
  );
}

