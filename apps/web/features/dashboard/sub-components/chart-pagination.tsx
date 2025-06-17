export const ChartPagination = ({
  total,
  current,
  onDotClick,
}: {
  total: number;
  current: number;
  onDotClick: (index: number) => void;
}) => (
  <div className="fixed right-12 top-1/2 -translate-y-1/2 flex flex-col gap-2">
    {Array.from({ length: total }).map((_, i) => (
      <button
        key={i}
        onClick={() => onDotClick(i)}
        className={`w-2 h-2 rounded-full transition-all ${
          i === current
            ? "bg-primary scale-125"
            : "bg-muted hover:bg-primary/50"
        }`}
      />
    ))}
  </div>
);
