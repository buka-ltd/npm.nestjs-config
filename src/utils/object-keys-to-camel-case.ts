
import { toCamelCase } from './to-camel-case.js'


function anyToCamelCase<T>(value: T): T {
  if (typeof value !== 'object') return value

  if (Array.isArray(value)) {
    return value.map((v) => anyToCamelCase(v) as unknown) as T
  }

  const result = {} as T

  for (const key in value) {
    result[toCamelCase(key)] = anyToCamelCase(value[key])
  }
  return result
}

export function objectKeysToCamelCase(value: Record<string, any>): Record<string, any> {
  return anyToCamelCase(value)
}
