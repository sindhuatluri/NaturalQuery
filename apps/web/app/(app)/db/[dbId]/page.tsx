"use client";

import React, { useState, useRef, useEffect } from "react";
import { DashboardComponent } from "@/features/dashboard/dashboard-component";
import { Message } from "@/features/dashboard/dashboard-types";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getDbConnection,
  sendMessage,
  SendMessageInput,
} from "@/features/http";

const Page = () => {
  const { replace } = useRouter();
  const { dbId } = useParams();
  const {
    data: dbConnection,
    isPending,
    isError,
    isSuccess,
  } = useQuery({
    queryKey: ["db", dbId],
    queryFn: () => getDbConnection(dbId as string),
  });

  useEffect(() => {
    if (isError && !isSuccess) {
      replace("/");
    }
  }, [isError, isSuccess, replace]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const queryClient = useQueryClient();
  const { mutateAsync: sendChatMessage } = useMutation({
    mutationFn: (input: SendMessageInput) =>
      sendMessage(input, {
        onSqlQuery: (data) => {
          setMessages((prev) => {
            const newMessages = [...prev];
            const previousMessage = newMessages[newMessages.length - 1];
            newMessages[newMessages.length - 1] = {
              ...previousMessage,
              content: data.content,
              sqlQuery: data.query,
            };
            return newMessages;
          });
        },
        onSqlResults: (data) => {
          setMessages((prev) => {
            const newMessages = [...prev];
            const previousMessage = newMessages[newMessages.length - 1];
            newMessages[newMessages.length - 1] = {
              ...previousMessage,
              data: data.results,
            };
            return newMessages;
          });
        },
        onVisualization: (data) => {
          setMessages((prev) => {
            const newMessages = [...prev];
            const previousMessage = newMessages[newMessages.length - 1];
            newMessages[newMessages.length - 1] = {
              ...previousMessage,
              chartData: data.chartData,
            };
            return newMessages;
          });
        },
        onError: (error) => {
          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              id: crypto.randomUUID(),
              role: "assistant",
              content: error.message || "An error occurred",
            };
            return newMessages;
          });
        },
        onComplete: (data) => {
          queryClient.invalidateQueries({ queryKey: ["chats"] });
          window.history.pushState(
            {},
            "",
            `/db/${data.dbId}/chat/${data.chatId}`,
          );
        },
      }),
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim()) return;
    if (isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
    };

    const thinkingMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "thinking",
    };

    setMessages((prev) => [...prev, userMessage, thinkingMessage]);
    setInput("");
    setIsLoading(true);

    const apiMessages = [...messages, userMessage].map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      // when replace the url state, the useParam does not update the value of the chat id
      const path = window.location.pathname;
      const parts = path.split("/");
      const windowChatId = parts[4];

      await sendChatMessage({
        messages: apiMessages,
        dbConnectionId: dbConnection?.data.id,
        ...(windowChatId && { chatId: windowChatId }),
      });
    } catch (error) {
      console.error("Submit Error:", error);
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "I apologize, I encountered an error. Please try again.",
        };
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = event.target;
    setInput(textarea.value);
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        const form = e.currentTarget.form;
        if (form) {
          const submitEvent = new Event("submit", {
            bubbles: true,
            cancelable: true,
          });
          form.dispatchEvent(submitEvent);
        }
      }
    }
  };

  if (isPending) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <video className="w-32" autoPlay loop muted>
          <source src="/dark.webm" type="video/mp4" />
        </video>
        <p className="text-sm font-normal text-muted-foreground">
          Loading database connection...
        </p>
      </div>
    );
  }

  return (
    <DashboardComponent
      textAreaRef={textAreaRef}
      messages={messages}
      input={input}
      isLoading={isLoading}
      onInputChange={handleInputChange}
      onKeyDown={handleKeyDown}
      onSubmit={handleSubmit}
    />
  );
};

export default Page;
