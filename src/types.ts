export type Get<O, Keys extends unknown[]> = Keys extends [infer Key, ...infer Rest]
  ? Key extends keyof O
    ? Get<O[Key], Rest>
    : never
  : O;
