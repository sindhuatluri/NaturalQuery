import React from "react";
import { ChartRenderer } from "@/components/chart-renderer";
import type { ChartData } from "@/types/chart";

interface SafeChartRendererProps {
  data: ChartData;
}

export const SafeChartRenderer: React.FC<SafeChartRendererProps> = ({
  data,
}) => {
  try {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="w-full flex-1 mx-auto">
          <ChartRenderer data={data} />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Chart rendering error:", error);
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 space-y-4">
        <div className="text-destructive font-medium">
          Error rendering chart
        </div>
        <div className="text-sm text-muted-foreground text-center max-w-md">
          {error instanceof Error ? error.message : "An unknown error occurred"}
        </div>
      </div>
    );
  }
};
