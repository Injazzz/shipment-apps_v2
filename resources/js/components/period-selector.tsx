import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";

interface PeriodSelectorProps {
  period: string;
  setPeriod: (period: string) => void;
  dateRange: { from: Date; to: Date };
  setDateRange: (range: { from: Date; to: Date }) => void;
}

export function PeriodSelector({
  period,
  setPeriod,
  dateRange,
  setDateRange,
}: PeriodSelectorProps) {
  const periods = [
    { value: "day", label: "Harian" },
    { value: "week", label: "Mingguan" },
    { value: "month", label: "Bulanan" },
    { value: "quarter", label: "Kuartalan" },
    { value: "year", label: "Tahunan" },
  ];

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-[150px] justify-start">
            {periods.find((p) => p.value === period)?.label || "Pilih Periode"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {periods.map((p) => (
            <DropdownMenuItem key={p.value} onClick={() => setPeriod(p.value)}>
              {p.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Calendar
        mode="range"
        selected={dateRange}
        onSelect={(range) => {
          if (range?.from && range?.to) {
            setDateRange({ from: range.from, to: range.to });
          }
        }}
        className="rounded-md border"
      />
    </div>
  );
}