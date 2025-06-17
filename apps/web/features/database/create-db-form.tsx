"use client";

import { useState, useEffect } from "react";
import ReactConfetti from "react-confetti";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeftIcon, CheckIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDatabaseConnection, updateDatabaseConnection, DbConnection, DbType } from "../http";

export type DatabaseType = "postgres" | "mysql" | "mssql";

const baseSchema = {
  displayName: z.string().min(1, "Display name is required"),
  host: z.string().min(1, "Host is required"),
  port: z
    .string()
    .min(1, "Port is required")
    .regex(/^\d+$/, "Port must be a number")
    .transform(Number)
    .refine((n) => n > 0 && n <= 65535, "Port must be between 1 and 65535"),
  database: z.string().min(1, "Database name is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
};

const formSchema = z.object({
  ...baseSchema,
  type: z.enum(["postgres", "mysql", "mssql"]),
});

export type DatabaseFormValues = z.infer<typeof formSchema>;

const defaultValuesByType = {
  postgres: {
    port: "5432",
    username: "postgres",
  },
  mysql: {
    port: "3306",
    username: "root",
  },
  mssql: {
    port: "1433",
    username: "sa",
  },
};

const labelsByType = {
  postgres: {
    title: "Connect PostgreSQL Database",
    host: "Host address",
    hostPlaceholder: "localhost",
    databasePlaceholder: "postgres",
  },
  mysql: {
    title: "Connect MySQL Database",
    host: "Host address",
    hostPlaceholder: "localhost",
    databasePlaceholder: "mysql",
  },
  mssql: {
    title: "Connect MSSQL Database",
    host: "Server",
    hostPlaceholder: "localhost",
    databasePlaceholder: "master",
  },
};

interface DatabaseConnectionFormProps {
  type?: DatabaseType;
  initialValues?: Partial<DatabaseFormValues>;
  connectionId?: string;
  onSuccess?: () => void;
}

export function DatabaseConnectionForm({
  type = "postgres",
  initialValues,
  connectionId,
  onSuccess,
}: DatabaseConnectionFormProps) {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  const { push } = useRouter();
  const queryClient = useQueryClient();
  const { mutate, isPending, isError, isSuccess } = useMutation({
    mutationFn: (values: DatabaseFormValues) => {
      const payload: DbConnection = {
        name: values.displayName,
        type: values.type as DbType,
        credentials: {
          type: values.type as DbType,
          host: values.host,
          port: values.port,
          database: values.database,
          username: values.username,
          password: values.password,
        },
      };

      if (connectionId) {
        return updateDatabaseConnection(connectionId, payload);
      }
      return createDatabaseConnection(payload);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ["dbs"],
      });

      if (onSuccess) {
        onSuccess();
        return;
      }

      setTimeout(() => {
        push(`/db/${response.data.id}`);
      }, 2000);
    },
  });

  const labels = labelsByType[type];

  const form = useForm<DatabaseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type,
      displayName: "",
      host: "",
      database: "",
      username: defaultValuesByType[type].username,
      port: +defaultValuesByType[type].port,
      password: "",
    },
  });

  useEffect(() => {
    if (initialValues) {
      form.reset(initialValues);
    }
  }, [initialValues, form]);

  async function handleSubmit(values: DatabaseFormValues) {
    mutate(values);
  }

  return (
    <div className="flex justify-center bg-background">
      {isSuccess && (
        <ReactConfetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
          colors={["#22c55e", "#3b82f6", "#f97316", "#8b5cf6"]}
          tweenDuration={10000}
          initialVelocityY={10}
          onConfettiComplete={(confetti) => {
            confetti?.reset();
          }}
        />
      )}

      <div className="flex-1 container">
        <Button asChild className="pl-6 gap-4" variant="link">
          <Link href="/db/connect">
            <ArrowLeftIcon className="w-4" /> Back
          </Link>
        </Button>
        <Card className="border-0 shadow-none max-w-3xl">
          <CardHeader>
            <CardTitle className="text-xl">{labels.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
              >
                {/* Display Name */}
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Display Name<span className="text-destructive">*</span>
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Name of the database connection to be displayed
                      </p>
                      <FormControl>
                        <Input
                          placeholder={`My ${type.toUpperCase()} Database`}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Host */}
                <FormField
                  control={form.control}
                  name="host"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {labels.host}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        {type === "mssql"
                          ? "Server name or IP address"
                          : "Host address of the database"}
                      </p>
                      <FormControl>
                        <Input
                          placeholder={labels.hostPlaceholder}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Port */}
                <FormField
                  control={form.control}
                  name="port"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Port<span className="text-destructive">*</span>
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Port number for the database connection
                      </p>
                      <FormControl>
                        <Input
                          placeholder={defaultValuesByType[type].port}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Database */}
                <FormField
                  control={form.control}
                  name="database"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Database<span className="text-destructive">*</span>
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Name of the database to connect to
                      </p>
                      <FormControl>
                        <Input
                          placeholder={labels.databasePlaceholder}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Username */}
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Username<span className="text-destructive">*</span>
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Username to connect to the database
                      </p>
                      <FormControl>
                        <Input
                          placeholder={defaultValuesByType[type].username}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Password<span className="text-destructive">*</span>
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Password to connect to the database
                      </p>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isError && (
                  <p className={"text-[0.8rem] font-medium text-destructive"}>
                    Failed to connect to the database
                  </p>
                )}

                <Button
                  disabled={isPending || isSuccess}
                  type="submit"
                  className="w-full"
                >
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}

                  {isSuccess && (
                    <CheckIcon className="mr-2 h-4 w-4 text-green-600" />
                  )}

                  {isPending
                    ? "Testing Connection..."
                    : isSuccess
                      ? "Connection Successful"
                      : "Test and Save Connection"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
