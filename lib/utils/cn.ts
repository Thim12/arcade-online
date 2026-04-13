import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Kombiniert clsx und tailwind-merge für konfliktfreie Tailwind-Klassen.
 * Standardnutzung: cn('text-red-500', condition && 'font-bold', className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
