import { beforeEach, expect, test } from '@jest/globals'
import { ConfigModule } from './config.module'
import { Test } from '@nestjs/testing'
import { processEnvLoader } from './config-loader/process-env-loader.js'
import { Configuration } from './decorators/configuration.decorator.js'
import { ConfigurationFactory } from './configuration-factory'
import { RawConfigRegistry } from './raw-config-registry'

@Configuration('test_config')
class TestConfig {
  url!: string
}

beforeEach(() => {
  ;(ConfigurationFactory as any).instances = new Map()
  ;(RawConfigRegistry as any).fragments = new Map()
})

test('ConfigModule.register()', async () => {
  process.env['test_config__url'] = 'http://test.com'

  const dynamicModule = ConfigModule.register({
    providers: [TestConfig],
    loaders: [processEnvLoader()],
  })

  expect(dynamicModule.global).toBeTruthy()
  expect(dynamicModule.providers).toHaveLength(4)

  const moduleRef = await Test.createTestingModule({
    providers: dynamicModule.providers,
  }).compile()
  const testConfig = moduleRef.get<TestConfig>(TestConfig)

  expect(testConfig?.url).toEqual('http://test.com')
})
