import { ConfigurationDefinition, ConfigurationProperty } from './types/configuration-defintion.js'
import { toCamelCase } from './utils/to-camel-case.js'

export const CONFIG_KEY_PROPERTIES_METADATA = Symbol('@buka/nestjs-config:config-key:properties')


export class ConfigurationDefinitionRegistry {
  private static readonly definitionStore = new Set<ConfigurationDefinition>()
  private static readonly propertyStore = new WeakMap<object, ConfigurationProperty[]>()

  static register(provider: ConfigurationDefinition): void {
    this.definitionStore.add({ ...provider, scope: provider.scope && toCamelCase(provider.scope) })
  }

  static getAll(): Array<ConfigurationDefinition> {
    return [...this.definitionStore]
  }


  static registerProperty(target: object, property: ConfigurationProperty): void {
    if (typeof target !== 'object' || target === null) return

    this.propertyStore.set(target, [...(this.propertyStore.get(target) || []), property])
  }

  static getProperties(target: object): ConfigurationProperty[] {
    return this.propertyStore.get(target) || []
  }

  static getProperty(target: object, propertyKey: string | symbol): ConfigurationProperty {
    const properties = this.propertyStore.get(target)

    const property = properties?.find((prop) => prop.propertyKey === propertyKey)
    if (property) return property

    if (typeof propertyKey === 'symbol') {
      return { exclude: true, propertyKey }
    }

    return {
      exclude: false,
      propertyKey: propertyKey.toString(),
    }
  }
}
