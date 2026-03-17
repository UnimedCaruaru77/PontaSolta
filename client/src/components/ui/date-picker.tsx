import { useState } from "react";
import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn, toLocalNoon } from "@/lib/utils";

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  disabled?: boolean;
  placeholder?: string;
  isOverdue?: boolean;
}

export function DatePicker({ value, onChange, disabled, placeholder = "Selecionar data", isOverdue }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [inputMode, setInputMode] = useState(false);

  const handleCalendarSelect = (day: Date | undefined) => {
    onChange(day ? toLocalNoon(day) : null);
    setOpen(false);
    setInputMode(false);
    setInputValue("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);
    if (raw.length === 10) {
      const parsed = parse(raw, "dd/MM/yyyy", new Date());
      if (isValid(parsed)) {
        onChange(toLocalNoon(parsed));
        setInputMode(false);
        setInputValue("");
        setOpen(false);
      }
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setInputMode(false);
      setInputValue("");
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-8 w-full justify-start text-left font-normal text-xs bg-muted border-border hover:bg-accent",
            !value && "text-muted-foreground",
            isOverdue && "border-red-500/60 text-red-400"
          )}
        >
          <CalendarIcon className="mr-2 h-3 w-3 shrink-0" />
          <span className="flex-1 truncate">
            {value ? format(value, "dd/MM/yyyy", { locale: ptBR }) : placeholder}
          </span>
          {value && !disabled && (
            <X
              className="h-3 w-3 ml-1 text-muted-foreground hover:text-red-400 shrink-0"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
        <div className="p-2 border-b border-border">
          {inputMode ? (
            <Input
              autoFocus
              placeholder="dd/mm/aaaa"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              onBlur={() => { setInputMode(false); setInputValue(""); }}
              className="h-7 text-xs bg-muted border-border"
              maxLength={10}
            />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-full text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setInputMode(true)}
            >
              Digitar data manualmente (dd/mm/aaaa)
            </Button>
          )}
        </div>
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={handleCalendarSelect}
          locale={ptBR}
          className="[&_.rdp-day_button:hover]:bg-primary/20 [&_.rdp-day_button.rdp-day_selected]:bg-primary"
          initialFocus
        />
        {value && (
          <div className="p-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-full text-xs text-red-400 hover:text-red-300"
              onClick={() => { onChange(null); setOpen(false); }}
            >
              <X className="h-3 w-3 mr-1" /> Limpar data
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
