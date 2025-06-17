"use client";
import { useTheme } from "next-themes";
import { useLayoutEffect, useState, useMemo } from "react";
import { BundledTheme, codeToHtml } from "shiki/bundle/web";

interface CodeBlockProps {
  code: string;
  language?: string;
  theme?: BundledTheme;
}

export function CodeBlock({ code, language = "sql" }: CodeBlockProps) {
  const { resolvedTheme } = useTheme();
  const [html, setHtml] = useState<string>("");

  useLayoutEffect(() => {
    let isMounted = true;

    codeToHtml(code, {
      lang: language,
      theme: resolvedTheme === "dark" ? "vitesse-dark" : "vitesse-light",
    }).then((result) => {
      if (isMounted) setHtml(result);
    });

    return () => {
      isMounted = false;
    };
  }, [code, language, resolvedTheme]);

  const loadingIndicator = useMemo(() => <div>Loading...</div>, []);

  if (!html) return loadingIndicator;

  return (
    <div className="w-full">
      <div
        dangerouslySetInnerHTML={{ __html: html }}
        className="[&>pre]:overflow-x-auto [&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:whitespace-pre-wrap [&>pre]:break-words [&>pre]:text-sm [&>pre]:leading-relaxed border rounded-xl dark:border-none"
      />
    </div>
  );
}
