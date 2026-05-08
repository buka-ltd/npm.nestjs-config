/* eslint-disable @typescript-eslint/no-empty-object-type */

import { mergeDeepRight } from 'ramda'


type DeepMergeRight<T, U> = {
  [K in keyof T | keyof U]: K extends keyof U
    ? K extends keyof T
      ? T[K] extends object
        ? U[K] extends object
          ? DeepMergeRight<T[K], U[K]>
          : U[K]
        : U[K]
      : U[K]
    : K extends keyof T
      ? T[K]
      : never;
}

type DeepMergeAll<T extends any[]>
  = T extends [infer F, ...infer R]
    ? F extends object
      ? R extends any[]
        ? DeepMergeRight<F, DeepMergeAll<R>>
        : F
      : never
    : {}


export function deepMergeAll<T extends object[]>(list: T): DeepMergeAll<T> {
  return list.reduce((acc, curr) => mergeDeepRight(acc, curr)) as DeepMergeAll<T>
}
