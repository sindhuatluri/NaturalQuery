"use client";

import { BackgroundLines } from "@/components/ui/background-lines";
import { SignUp } from "@clerk/nextjs";
import { dark, experimental__simple as simple } from "@clerk/themes";
import { useTheme } from "next-themes";

export default function Page() {
  const { resolvedTheme } = useTheme();
  return (
    <BackgroundLines className="flex items-center justify-center w-full flex-col px-4">
      <SignUp
        appearance={{ baseTheme: resolvedTheme === "dark" ? dark : simple }}
      />
    </BackgroundLines>
  );
}
