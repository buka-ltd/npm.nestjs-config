import { expect, test } from '@jest/globals'
import { composeLoader } from './compose-loader.js'


test('composeLoader', async () => {
  const result = await composeLoader([
    () => Promise.resolve({ a: 1 }),
    () => Promise.resolve({ b: 2 }),
    () => Promise.resolve({ c: 3 }),
  ])({})

  expect(result).toEqual({
    a: 1,
    b: 2,
    c: 3,
  })
})
