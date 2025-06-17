import { useEffect, useRef, RefObject } from "react";

export function useScrollToBottom<T extends HTMLElement>(): [
  RefObject<T>,
  RefObject<T>,
] {
  const containerRef = useRef<T>(null);
  const endRef = useRef<T>(null);

  useEffect(() => {
    const container = containerRef.current;
    const end = endRef.current;

    if (container && end) {
      // Immediate scroll when messages change
      end.scrollIntoView({ behavior: "smooth", block: "end" });

      const observer = new MutationObserver((mutations) => {
        // Add a small delay to ensure content is rendered
        setTimeout(() => {
          end.scrollIntoView({ behavior: "smooth", block: "end" });
        }, 100);
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });

      return () => observer.disconnect();
    }
  }, []);

  // @ts-ignore
  return [containerRef, endRef];
}
