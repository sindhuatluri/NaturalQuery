import React, { useRef, useCallback, useEffect } from "react";
import { DashboardProps } from "./dashboard-types";
import { MessageComponent } from "./sub-components/message-component";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { ArrowUpIcon, Loader2 } from "lucide-react";
import { cx } from "class-variance-authority";
import { DatabaseSchema } from "./sub-components/db-struc";
import { Overview } from "./overview";
import { StarsBackground } from "@/components/ui/stars-background";
import { ShootingStars } from "@/components/ui/shooting-stars";

const suggestedActions = [
  {
    title: "Total signups analysis",
    label: "Show me trends and patterns",
    action: "Can you analyze the total signups and show me trends?",
  },
  {
    title: "Revenue breakdown",
    label: "for the last quarter",
    action: "Show me the revenue breakdown for the last quarter",
  },
];

export const DashboardComponent: React.FC<DashboardProps> = ({
  input,
  isLoading,
  onInputChange,
  onKeyDown,
  onSubmit,
  messages,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, [input]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(event);
    adjustHeight();
  };

  const submitForm = useCallback(() => {
    if (input.trim() && formRef.current) {
      formRef.current.requestSubmit();
    }
  }, [input]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      });
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [messages]);

  return (
    <div className="flex flex-col min-w-0 h-full bg-background">
      <StarsBackground />
      <ShootingStars />
      <header className="flex h-min sticky top-0 bg-background items-center px-2 md:px-2 gap-2">
        <DatabaseSchema />
      </header>
      <div className="flex overflow-x-hidden flex-col min-w-0 gap-6 flex-1 overflow-auto">
        {messages.length === 0 && <Overview />}
        {messages.map((message) => (
          <MessageComponent key={message.id} message={message} />
        ))}
        <div className="shrink-0 min-w-[24px] min-h-[24px] pb-24" />
      </div>

      <form
        onSubmit={onSubmit}
        className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-4xl sticky bottom-0 z-[3]"
      >
        <div className="relative w-full flex flex-col gap-4">
          {messages.length === 0 && (
            <div className="grid sm:grid-cols-2 gap-2 w-full">
              {suggestedActions.map((suggestedAction, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: 0.05 * index }}
                  key={index}
                >
                  <Button
                    variant="ghost"
                    type="button"
                    className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
                    onClick={() => {
                      // Set the textarea value using onInputChange
                      onInputChange({
                        target: { value: suggestedAction.action },
                      } as React.ChangeEvent<HTMLTextAreaElement>);
                    }}
                  >
                    <span className="font-medium">{suggestedAction.title}</span>
                    <span className="text-muted-foreground">
                      {suggestedAction.label}
                    </span>
                  </Button>
                </motion.div>
              ))}
            </div>
          )}

          <Textarea
            ref={textareaRef}
            placeholder="Ask questions or visualize your data.."
            value={input}
            onKeyDownCapture={onKeyDown}
            onChange={handleInput}
            className={cx(
              "min-h-[24px] overflow-hidden resize-none rounded-xl text-base bg-muted",
            )}
            rows={3}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (isLoading) {
                } else {
                  submitForm();
                }
              }
            }}
          />

          {isLoading ? (
            <Button
              className="rounded-full p-1.5 h-fit absolute bottom-2 right-2 m-0.5 z-1"
              onClick={(event) => {
                event.preventDefault();
              }}
            >
              <Loader2 className="animate-spin" />
            </Button>
          ) : (
            <Button
              type="submit"
              className="rounded-full p-1.5 h-fit absolute bottom-2 right-2 m-0.5"
              disabled={input.length === 0}
            >
              <ArrowUpIcon size={14} />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};
