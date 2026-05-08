import { LoadRawConfigFn } from '~/types/config-loader.js'
import { deepMergeAll } from './deep-merge-all.js'

export function composeLoader(loaders: LoadRawConfigFn[]): LoadRawConfigFn {
  return async (options) => {
    const configs = await Promise.all(loaders.map((loader) => Promise.resolve(loader(options))))
    return deepMergeAll(configs)
  }
}
