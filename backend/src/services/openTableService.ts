import { env } from '../config/env.js';

function defaultDateTime() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(19, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Kept for older clients. Guest UI must not use a global OpenTable search. */
export function openTableSearchUrl(input: { query?: string; covers?: number; dateTime?: string }) {
  const covers = Math.min(20, Math.max(1, Number(input.covers ?? 2)));
  const dateTime = input.dateTime || defaultDateTime();
  const term = input.query?.trim() || env.OPENTABLE_SEARCH_TERM;
  const url = new URL('https://www.opentable.com/s');
  url.searchParams.set('covers', String(covers));
  url.searchParams.set('dateTime', dateTime);
  url.searchParams.set('term', term);
  return url.toString();
}

export { restaurantReservation } from './restaurantBookingService.js';
