import { beforeEach, expect, test } from '@jest/globals'
import { ConfigModule, Configuration, processEnvLoader } from '~/index'
import { ConfigurationFactory } from '~/configuration-factory'
import { RawConfigRegistry } from '~/raw-config-registry'

@Configuration('preloadTestConfig')
class PreloadTestConfig {
  url!: string
}

beforeEach(() => {
  ;(ConfigurationFactory as any).instances = new Map()
  ;(RawConfigRegistry as any).fragments = new Map()
})

test('ConfigModule.preload', async () => {
  process.env['preloadTestConfig__url'] = 'http://test.com'

  await ConfigModule.preload({
    providers: [PreloadTestConfig],
    loaders: [processEnvLoader()],
  })

  const testConfig = await ConfigModule.get(PreloadTestConfig)
  expect(testConfig?.url).toEqual('http://test.com')
})
