import { ChartData } from "@/types/chart";
import { api, getTokenFromCookie } from "./api";

type DatabaseRecord = {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  lastConnectedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type DbConnection = {
  name: string;
  type: DbType;
  credentials: DbCredentials;
};

const DB_TYPES = {
  POSTGRES: "postgres",
  MYSQL: "mysql",
  SQLSERVER: "sqlserver",
} as const;

export type DbType = (typeof DB_TYPES)[keyof typeof DB_TYPES];

interface BaseDbCredentials {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export interface PostgresCredentials extends BaseDbCredentials {
  type: typeof DB_TYPES.POSTGRES;
  schema?: string;
}

export interface MySQLCredentials extends BaseDbCredentials {
  type: typeof DB_TYPES.MYSQL;
}

export interface SQLServerCredentials extends BaseDbCredentials {
  type: typeof DB_TYPES.SQLSERVER;
  domain?: string;
  trustServerCertificate?: boolean;
  encrypt?: boolean;
  instanceName?: string;
}

export type DbCredentials =
  | PostgresCredentials
  | MySQLCredentials
  | SQLServerCredentials;

export const getDatabaseConnections = async () => {
  const { data } = await api.get<{
    success: boolean;
    data: DatabaseRecord[];
  }>(`/db`);

  return data;
};

export const getDbConnection = async (id: string) => {
  const { data } = await api.get<{
    success: boolean;
    data: DatabaseRecord;
  }>(`/db/${id}`);

  return data;
};

export const createDatabaseConnection = async (connection: DbConnection) => {
  const { data } = await api.post<{
    success: boolean;
    data: DatabaseRecord;
  }>(`/db`, connection);

  return data;
};

export const deleteDatabaseConnection = async (id: string) => {
  const { data } = await api.delete<{ success: boolean }>(`/db/${id}`);

  return data;
};

export const updateDatabaseConnection = async (id: string, connection: Partial<DbConnection>) => {
  const { data } = await api.put<{
    success: boolean;
    data: DatabaseRecord;
  }>(`/db/${id}`, connection);

  return data;
};

export const getDatabaseSchema = async (id: string) => {
  const { data } = await api.get<{
    success: boolean;
    data: any;
  }>(`/db/${id}/structure`);

  return data;
};

export type SendMessageInput = {
  messages: {
    role: string;
    content: string;
  }[];
  chatId?: string;
  dbConnectionId?: string;
};

type StreamChunkType =
  | "sql-query"
  | "sql-results"
  | "visualization"
  | "error"
  | "complete";
interface StreamChunk {
  type: StreamChunkType;
  data: any;
  timestamp: number;
}

export const sendMessage = async (
  input: SendMessageInput,
  {
    onSqlQuery,
    onSqlResults,
    onVisualization,
    onError,
    onComplete,
  }: {
    onSqlQuery?: (data: any) => void;
    onSqlResults?: (data: any) => void;
    onVisualization?: (data: any) => void;
    onError?: (error: any) => void;
    onComplete?: (data: any) => void;
  } = {},
) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/chat/message`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          Authorization: `Bearer ${getTokenFromCookie()}`,
        },
        body: JSON.stringify(input),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder("utf-8");

    let done = false;
    while (!done) {
      const { value, done: streamDone } = await reader?.read()!;
      done = streamDone;
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const parsedChunk: StreamChunk = JSON.parse(line);

            switch (parsedChunk.type) {
              case "sql-query":
                onSqlQuery?.(parsedChunk.data);
                break;
              case "sql-results":
                onSqlResults?.(parsedChunk.data);
                break;
              case "visualization":
                onVisualization?.(parsedChunk.data);
                break;
              case "complete":
                onComplete?.(parsedChunk.data);
                break;
              case "error":
                onError?.(parsedChunk.data);
                break;
            }
          } catch (e) {
            console.error("Error parsing chunk:", e);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error fetching stream:", error);
    onError?.(error);
  }
};

export const getChatWithMessages = async (chatId: string) => {
  const { data } = await api.get<{
    success: boolean;
    data: any;
  }>(`/chat/${chatId}`);

  return data;
};

type Chats = {
  id: string;
  dbConnectionId: string;
  name: string;
  createdAt: Date;
  lastMessageAt: Date | null;
}[];

export const getChats = async () => {
  const { data } = await api.get<{
    success: boolean;
    data: Chats;
  }>(`/chat`);

  return data;
};

export const deleteChat = async (chatId: string) => {
  const { data } = await api.delete<{
    success: boolean;
  }>(`/chat/${chatId}`);

  return data;
};
