"use client";

import { useScrollTop } from "@/hooks/useScrollTop";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { ModeToggle } from "@/components/mode-toggle";
import { useConvexAuth } from "convex/react";
import { SignInButton, UserButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";
import Link from "next/link";

export const Navbar = () => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const scrolled = useScrollTop();

  return (
    <nav
      className={cn(
        "fixed inset-x-0 top-0 z-50 flex w-full items-center justify-between bg-white/80 px-4 py-3 backdrop-blur-md transition-all duration-200 sm:px-6 dark:bg-neutral-900/80",
        scrolled && "border-b border-neutral-200 dark:border-neutral-800",
      )}
    >
      <Logo />

      <div className="flex items-center gap-4">
        {isLoading && <Spinner size="sm" />}

        {!isLoading && !isAuthenticated && (
          <>
            <SignInButton mode="modal">
              <Button
                variant="ghost"
                size="sm"
                className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              >
                Log in
              </Button>
            </SignInButton>
            <SignInButton mode="modal">
              <Button
                size="sm"
                className="rounded-lg bg-blue-600 font-medium text-white hover:bg-blue-700"
              >
                Get Noted free
              </Button>
            </SignInButton>
          </>
        )}

        {isAuthenticated && !isLoading && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              asChild
            >
              <Link href="/documents">Enter Noted</Link>
            </Button>
            <UserButton afterSignOutUrl="/" />
          </>
        )}

        <ModeToggle />
      </div>
    </nav>
  );
};
