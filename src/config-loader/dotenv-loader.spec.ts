import { afterEach, expect, jest, test } from '@jest/globals'
import * as fs from 'fs/promises'
import { dotenvLoader } from './dotenv-loader.js'
import { Logger } from '@nestjs/common'


afterEach(() => {
  jest.clearAllMocks()
})

test('dotenvLoader', async () => {
  const warn = jest.spyOn(Logger, 'warn')

  await fs.writeFile('/.env', 'T1=t1\nT2=${T2}')

  const testConfig = await dotenvLoader('/.env').load({ suppressWarnings: true })
  expect(testConfig['T1']).toBe('t1')
  expect(testConfig['T2']).toBe('${T2}')
  expect(warn.mock.calls.length).toBe(0)

  const unknownConfig = await dotenvLoader('unknown.env').load({})
  expect(unknownConfig).toEqual({})

  expect(warn.mock.calls.length).toBe(1)
})
