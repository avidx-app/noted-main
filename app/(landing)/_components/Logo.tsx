import { cn } from "@/lib/utils";
import { DM_Serif_Display } from "next/font/google";

const font = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
});

export const Logo = () => {
  return (
    <span
      className={cn(
        "text-2xl font-semibold tracking-tight text-foreground",
        font.className,
      )}
    >
      Noted
    </span>
  );
};
