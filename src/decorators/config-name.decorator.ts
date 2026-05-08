
import { ConfigurationDefinitionRegistry } from '~/configuration-registry.js'


/**
 * @deprecated Use `@ConfigKey` instead
 */
export function ConfigName(name: string): PropertyDecorator {
  return (target, propertyKey) => {
    ConfigurationDefinitionRegistry.registerProperty(target, { exclude: false, propertyKey, bind: name })
  }
}
