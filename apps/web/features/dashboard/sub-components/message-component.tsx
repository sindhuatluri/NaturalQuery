"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, TableIcon, BarChart3 } from "lucide-react";
import { CodeBlock } from "./code-block";
import { cx } from "class-variance-authority";
import { Markdown } from "@/components/markdown";
import { SafeTableRenderer } from "./safe-table-renderer";
import { SafeChartRenderer } from "./safe-chart-renderer";
import { Message } from "../dashboard-types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface MessageComponentProps {
  message: Message;
}

const fadeIn = {
  initial: { opacity: 0, y: 0 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const MessageComponent: React.FC<MessageComponentProps> = ({
  message,
}) => {
  const isLoading =
    message.role === "assistant" && message.content === "thinking";
  const hasVisualization = message.chartData || message.data;
  const defaultTab = message.chartData ? "chart" : "table";

  return (
    <motion.div
      className="w-full mx-auto max-w-3xl px-4 group/message z-[2]"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      data-role={message.role}
    >
      <div
        className={cx(
          "flex gap-4 group-data-[role=user]/message:px-5 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-3.5 rounded-xl",
          {
            "group-data-[role=user]/message:bg-muted": message.role === "user",
          },
        )}
      >
        <AnimatePresence>
          {message.role === "assistant" && (
            <motion.div
              key="sparkles-icon"
              className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <Sparkles className="size-4" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="flex flex-col shrink-0 gap-2 w-full"
          variants={staggerChildren}
        >
          <motion.div className="flex flex-col gap-4">
            <AnimatePresence>
              {message.content !== "thinking" && (
                <motion.div
                  key="message-content"
                  variants={fadeIn}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  <Markdown>{message.content}</Markdown>
                </motion.div>
              )}

              {isLoading ? (
                <motion.div
                  key="loading-skeleton"
                  className="w-full space-y-2"
                  variants={fadeIn}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  <Skeleton className="h-4 w-[20%]" />
                  <Skeleton className="h-4 w-[30%]" />
                  <Skeleton className="h-4 w-[35%]" />
                </motion.div>
              ) : (
                message.sqlQuery && (
                  <motion.div
                    key="sql-query"
                    className="w-full"
                    variants={fadeIn}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                  >
                    <CodeBlock code={message.sqlQuery} />
                  </motion.div>
                )
              )}
            </AnimatePresence>

            <AnimatePresence>
              {hasVisualization && (
                <motion.div
                  key="visualization-tabs"
                  variants={scaleIn}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.4 }}
                >
                  <Tabs defaultValue={defaultTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger
                        value="table"
                        disabled={!message.data}
                        className="flex items-center gap-2"
                      >
                        <TableIcon className="h-4 w-4" />
                        Table
                      </TabsTrigger>
                      <TabsTrigger
                        value="chart"
                        disabled={!message.chartData}
                        className="flex items-center gap-2"
                      >
                        <BarChart3 className="h-4 w-4" />
                        Chart
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="table">
                      {message.data && (
                        <motion.div
                          key="table-content"
                          className="w-full mt-4"
                          variants={fadeIn}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                        >
                          <SafeTableRenderer data={message.data} />
                        </motion.div>
                      )}
                    </TabsContent>
                    <TabsContent value="chart">
                      {message.chartData && (
                        <motion.div
                          key="chart-content"
                          className="w-full min-h-[300px] mt-4"
                          variants={fadeIn}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                        >
                          <SafeChartRenderer data={message.chartData} />
                        </motion.div>
                      )}
                    </TabsContent>
                  </Tabs>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};
