import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, symbol = '$'): string {
  const formatted = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
  return `${symbol} ${formatted}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-CO').format(value);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function generateId(prefix = ''): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return prefix ? `${prefix}_${ts}${rand}` : `${ts}${rand}`;
}

export function generateSequentialId(prefix: string, existingIds: string[] = []): string {
  let maxSeq = 0;
  let padLength = 3;
  const regex = new RegExp(`^${prefix}_?(\\d+)$`, 'i');

  for (const id of existingIds) {
    const match = id?.match(regex);
    if (match) {
      const numStr = match[1];
      const num = parseInt(numStr, 10);
      if (numStr.length > padLength) padLength = numStr.length;
      if (num > maxSeq) maxSeq = num;
    }
  }

  const nextSeq = maxSeq + 1;
  const seqStr = String(nextSeq).padStart(padLength, '0');
  return prefix ? `${prefix}_${seqStr}` : seqStr;
}

export function generateSkuFromName(name: string): string {
  if (!name || !name.trim()) return '';

  const stopWords = new Set([
    'DE', 'DEL', 'LA', 'EL', 'LOS', 'LAS', 'CON', 'EN', 'PARA', 'POR', 'Y', 'A', 'O', 'UN', 'UNA', 'AL',
  ]);

  const clean = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, ' ');

  const tokens = clean.split(/[\s-]+/).filter(Boolean);
  const processed: string[] = [];

  for (const token of tokens) {
    if (stopWords.has(token)) continue;

    const isMeasurementOrNumber = /^\d+[A-Z]*$/i.test(token) || /^[A-Z]*\d+$/i.test(token);

    if (isMeasurementOrNumber) {
      processed.push(token);
    } else if (token.length <= 3) {
      processed.push(token);
    } else {
      processed.push(token.slice(0, 3));
    }
  }

  return processed.slice(0, 4).join('-');
}

export function generateReference(prefix: string, seq: number): string {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(seq).padStart(5, '0')}`;
}

export function isSameDay(a: string | Date, b: string | Date): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export function isThisMonth(date: string | Date): boolean {
  const d = new Date(date);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export function startOfDay(date: string | Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}
