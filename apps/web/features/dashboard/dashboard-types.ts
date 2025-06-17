import type { ChartData } from "@/types/chart";

export interface Message {
  id: string;
  role: string;
  content: string;
  hasToolUse?: boolean;
  chartData?: ChartData;
  sqlQuery?: string;
  data?: Record<string, unknown>[];
}

export interface FileUpload {
  base64: string;
  fileName: string;
  mediaType: string;
  isText?: boolean;
  fileSize?: number;
}

export interface Model {
  id: string;
  name: string;
}

export interface APIResponse {
  content: string;
  hasToolUse: boolean;
  toolUse?: {
    type: "tool_use";
    id: string;
    name: string;
    input: ChartData;
  };
  chartData?: ChartData;
}

export interface DashboardProps {
  messages: Message[];
  input: string;
  isLoading: boolean;
  onInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  textAreaRef: React.RefObject<HTMLTextAreaElement | null>;
}
