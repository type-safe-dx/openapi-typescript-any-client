export type Get<O, Keys extends unknown[]> = Keys extends [infer Key, ...infer Rest]
  ? Key extends keyof O
    ? Get<Required<O>[Key], Rest>
    : never
  : O;
