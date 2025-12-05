import { Logo } from "./Logo";

export const Footer = () => {
  return (
    <footer className="w-full border-t border-neutral-100 bg-white py-12 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Logo */}
          <Logo />

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-neutral-500">
            <a
              href="#"
              className="transition-colors hover:text-neutral-900 dark:hover:text-white"
            >
              Privacy
            </a>
            <a
              href="#"
              className="transition-colors hover:text-neutral-900 dark:hover:text-white"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
