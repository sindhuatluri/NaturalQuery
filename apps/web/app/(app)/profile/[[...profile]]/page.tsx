"use client";

import { UserProfile } from "@clerk/nextjs";
import { dark, experimental__simple as simple } from "@clerk/themes";
import { useTheme } from "next-themes";

export default function Page() {
  const { resolvedTheme } = useTheme();
  return (
    <div className="flex flex-1 justify-center items-center">
      <UserProfile
        appearance={{
          baseTheme: resolvedTheme === "dark" ? dark : simple,
        }}
      />
    </div>
  );
}
