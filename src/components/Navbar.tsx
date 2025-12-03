"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/20 dark:border-slate-700/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link 
              href="/feed" 
              className="text-2xl font-bold gradient-text hover:scale-105 transition-transform duration-300"
            >
              Shortform
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/feed"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  pathname === "/feed"
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                    : "text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50"
                }`}
              >
                Feed
              </Link>
              <Link
                href="/upload"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  pathname === "/upload"
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                    : "text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50"
                }`}
              >
                Upload
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {session?.user && (
              <>
                <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-lg bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm">
                  {session.user.image && (
                    <img
                      src={session.user.image}
                      alt={session.user.name ?? "User"}
                      className="h-8 w-8 rounded-full ring-2 ring-blue-500/50"
                    />
                  )}
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {session.user.name ?? session.user.email}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 active:scale-95"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

