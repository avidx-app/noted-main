import { Footer } from "./_components/Footer";
import { Heading } from "./_components/Heading";
import { Heroes } from "./_components/Heroes";
import { Features } from "./_components/Features";
import { Showcase } from "./_components/Showcase";

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-col bg-white dark:bg-neutral-900">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center px-4 pb-16 pt-14 sm:px-6 md:pb-20 md:pt-24">
        <Heading />
        <Heroes />
      </div>

      {/* Features Section */}
      <Features />

      {/* CTA Section */}
      <Showcase />

      {/* Footer */}
      <Footer />
    </div>
  );
}
