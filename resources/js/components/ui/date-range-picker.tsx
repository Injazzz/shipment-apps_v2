// resources/js/Components/ui/date-range-picker.tsx
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { router } from '@inertiajs/react'
import { useState } from "react"

export function DateRangePicker({
  dateFrom,
  dateTo,
  className,
}: {
  dateFrom?: string
  dateTo?: string
  className?: string
}) {
  const [date, setDate] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: dateFrom ? new Date(dateFrom) : undefined,
    to: dateTo ? new Date(dateTo) : undefined,
  })

  const handleApply = () => {
    router.get(route('user.ship-operations.analytics'), {
      date_from: date.from ? format(date.from, 'yyyy-MM-dd') : undefined,
      date_to: date.to ? format(date.to, 'yyyy-MM-dd') : undefined,
    }, {
      preserveState: true,
      preserveScroll: true,
    })
  }

  const handleClear = () => {
    setDate({ from: undefined, to: undefined })
    router.get(route('user.ship-operations.analytics'), {}, {
      preserveState: true,
      preserveScroll: true,
    })
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={(range) => setDate({ from: range?.from, to: range?.to })}
            numberOfMonths={2}
          />
          <div className="flex justify-end gap-2 p-2 border-t">
            <Button variant="outline" size="sm" onClick={handleClear}>
              Clear
            </Button>
            <Button size="sm" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
