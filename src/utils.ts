export type ArrayKeys<T, P extends keyof T = keyof T> = P extends string
  ? T[P] extends unknown[]
    ? P
    : never
  : never;
