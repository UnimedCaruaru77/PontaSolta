import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toLocalNoon(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  if (typeof value === "string") {
    const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnly) {
      return new Date(+dateOnly[1], +dateOnly[2] - 1, +dateOnly[3], 12, 0, 0);
    }
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})[T ]/);
    if (isoMatch) {
      return new Date(+isoMatch[1], +isoMatch[2] - 1, +isoMatch[3], 12, 0, 0);
    }
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
  }
  if (isNaN(value.getTime())) return null;
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12, 0, 0);
}
