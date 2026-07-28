/**
 * @file utils.ts
 * @description Funciones auxiliares y utilidades de formato, generación de IDs y operaciones de fechas.
 * 
 * RELACIÓN CON OTROS MÓDULOS:
 * - Utilizado por `controllers` (para generar IDs de ventas/movimientos con `generateId` y `generateReference`).
 * - Utilizado por `views` (para formatear montos en moneda `$ 1,000`, fechas amigables y clases CSS dinámicas con `cn`).
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina clases CSS condicionales y resuelve conflictos de clases Tailwind.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea un valor numérico como moneda (ej. "$ 15.000").
 */
export function formatCurrency(value: number, symbol = '$'): string {
  const formatted = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
  return `${symbol} ${formatted}`;
}

/**
 * Formatea un valor numérico con separadores de millares.
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-CO').format(value);
}

/**
 * Formatea una fecha como string amigable (ej. "28 jul 2026").
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

/**
 * Formatea fecha y hora amigable (ej. "28 jul 2026, 14:30").
 */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Formatea únicamente la hora (ej. "14:30").
 */
export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Genera un ID único alfanumérico usando marcas de tiempo y aleatoriedad con prefijo opcional.
 * Invocado por: `ProductController`, `SalesController`, `CashController`, etc.
 */
export function generateId(prefix = ''): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return prefix ? `${prefix}_${ts}${rand}` : `${ts}${rand}`;
}

/**
 * Genera un ID secuencial autoincrementable manteniendo el formato prefijado (ej. "CLI_001").
 */
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

/**
 * Genera un código SKU sugerido automáticamente a partir del nombre de un producto.
 */
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

/**
 * Genera un número de referencia ordenado para comprobantes (ej. "V-2026-00001").
 */
export function generateReference(prefix: string, seq: number): string {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(seq).padStart(5, '0')}`;
}

/**
 * Determina si dos fechas corresponden al mismo día del año.
 */
export function isSameDay(a: string | Date, b: string | Date): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

/**
 * Determina si una fecha pertenece al mes actual.
 */
export function isThisMonth(date: string | Date): boolean {
  const d = new Date(date);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

/**
 * Devuelve el inicio del día (00:00:00.000) para la fecha dada.
 */
export function startOfDay(date: string | Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Retorna la fecha correspondiente a `n` días atrás.
 */
export function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}
