import { expect, test } from '@jest/globals'
import { processEnvLoader } from './process-env-loader.js'


test('processEnvLoader', () => {
  process.env['test_config__process_env_loader'] = 'true'

  const config = processEnvLoader()({ suppressWarnings: true })
  expect(config['test_config']).toEqual({ process_env_loader: true })
})
