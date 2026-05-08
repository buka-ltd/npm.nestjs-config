import { expect, test } from '@jest/globals'
import { ConfigName } from './config-name.decorator.js'
import { ConfigurationDefinitionRegistry } from '~/configuration-registry.js'

class TestClass {
  @ConfigName('test_class_url')
  url!: string
}

test('ConfigName', () => {
  const prop = ConfigurationDefinitionRegistry.getProperty(TestClass.prototype, 'url')
  expect(prop.exclude).toBe(false)
  expect(prop.bind).toBe('test_class_url')
})
