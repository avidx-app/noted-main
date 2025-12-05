"use client";

import { SignInButton } from "@clerk/clerk-react";
import { useConvexAuth } from "convex/react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";

export const Showcase = () => {
  const { isAuthenticated, isLoading } = useConvexAuth();

  return (
    <section className="w-full border-t border-neutral-100 bg-neutral-50 py-20 sm:py-24 dark:border-neutral-800 dark:bg-neutral-900/50">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        {/* Headline */}
        <h2 className="mb-6 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl dark:text-white">
          Start writing today
        </h2>
        <p className="mb-10 text-base text-neutral-600 sm:text-lg dark:text-neutral-400">
          Join thousands of people who use Noted to organize their thoughts,
          manage projects, and bring ideas to life.
        </p>

        {/* CTA */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          {isLoading && <Spinner size="md" />}
          {isAuthenticated && !isLoading && (
            <Button
              size="lg"
              className="h-12 rounded-lg bg-blue-600 px-8 text-base font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
              asChild
            >
              <Link href="/documents">
                Go to Noted
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

        {/* Trust indicators */}
        <p className="mt-8 text-sm text-neutral-500 dark:text-neutral-500">
          Free forever for personal use · No credit card required
        </p>
      </div>
    </section>
  );
};
