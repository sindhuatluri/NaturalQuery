export interface Message {
  role: string;
  content: string;
}

export interface ChartData {
  chartType: string;
  config: ChartConfig;
  data: any[];
  chartConfig: Record<string, ChartConfigItem>;
}

export interface ChartConfig {
  title: string;
  description: string;
  trend?: {
    percentage: number;
    direction: 'up' | 'down';
  };
  footer?: string;
  totalLabel?: string;
  xAxisKey?: string;
}

export interface ChartConfigItem {
  label: string;
  stacked?: boolean;
  color?: string;
}

export interface SendMessageRequest {
  messages: Message[];
}

export interface SendMessageResponse {
  content: string;
  hasToolUse: boolean;
  toolUse: any;
  chartData: ChartData | null;
}
