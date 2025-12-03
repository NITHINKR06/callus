import { redirect } from "next/navigation";

import { Feed } from "@/components/Feed";
import { Navbar } from "@/components/Navbar";
import { auth } from "@/server/auth";

export default async function FeedPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth");
  }

  return (
    <>
      <Navbar />
      <Feed />
    </>
  );
}

