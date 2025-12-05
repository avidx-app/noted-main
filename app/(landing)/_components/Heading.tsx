"use client";

import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@clerk/clerk-react";
import { useConvexAuth } from "convex/react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export const Heading = () => {
  const { isAuthenticated, isLoading } = useConvexAuth();

  return (
    <div className="flex max-w-4xl flex-col items-center space-y-8 px-2 text-center sm:px-0">
      {/* Main Headline */}
      <h1 className="text-center text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-7xl dark:text-white">
        Write, plan, and
        <br />
        get organized.
      </h1>

      {/* Subtitle */}
      <p className="max-w-2xl text-center text-lg text-neutral-600 sm:text-xl dark:text-neutral-400">
        A simple, powerful workspace for your notes, tasks, and ideas.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col items-center gap-4 pt-2 sm:flex-row">
        {isLoading && (
          <div className="flex w-full items-center justify-center">
            <Spinner size="md" />
          </div>
        )}
        {isAuthenticated && !isLoading && (
          <Button
            size="lg"
            className="h-12 rounded-lg bg-blue-600 px-8 text-base font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
            asChild
          >
            <Link href="/documents">
              Enter Noted
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
        {!isAuthenticated && !isLoading && (
          <>
            <SignInButton mode="modal">
              <Button
                size="lg"
                className="h-12 rounded-lg bg-blue-600 px-8 text-base font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                Get Noted free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </SignInButton>
          </>
        )}
      </div>
    </div>
  );
};
