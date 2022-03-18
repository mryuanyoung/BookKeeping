export const INDEXEDDB = 0b001;
export const MYSQL = 0b010;
export const LOCALSTORAGE = 0b100;

export function include(curr: number, mode: number): boolean {
  return (curr & mode) !== 0b0;
}
