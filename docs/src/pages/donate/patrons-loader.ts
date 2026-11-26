import * as fs from 'node:fs';

export interface Patron {
  from: string;
  months: number;
  style: number;
}

export const patrons: readonly Patron[] = JSON.parse(
  fs.readFileSync(new URL('../../../../renderer/public/data/patrons.json', import.meta.url), { encoding: 'utf8' }));

export function shuffle (array: unknown[]): void {
  let currentIndex = array.length;
  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] =
      [array[randomIndex], array[currentIndex]];
  }
}