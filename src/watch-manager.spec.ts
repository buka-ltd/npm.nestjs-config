import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { RawConfigRegistry, MergedConfig } from './raw-config-registry.js'
import { ConfigurationFactory } from './configuration-factory.js'
import { WatchManager } from './watch-manager.js'
import { RuntimeConfig } from './runtime-config.js'
import { ConfigLoader, WatchableConfigLoader } from './types/index.js'

const mockLoad: WatchableConfigLoader['load'] = () => Promise.resolve({})

function createMockRuntimeConfig(loaders: ConfigLoader[]): RuntimeConfig {
  return { loaders }
}

function mockDisposer(): () => void {
  return jest.fn()
}

function createWatchableLoader(
  startWatchImpl?: WatchableConfigLoader['startWatch'],
): WatchableConfigLoader {
  const defaultImpl = jest.fn().mockReturnValue(mockDisposer()) as unknown as WatchableConfigLoader['startWatch']
  return {
    load: mockLoad,
    startWatch: startWatchImpl ?? defaultImpl,
  }
}

describe('WatchManager', () => {
  let reloadRegistrySpy: any
  let readRegistrySpy: any
  let reloadFactorySpy: any

  beforeEach(() => {
    ;(ConfigurationFactory as any).instances = new Map()
    ;(RawConfigRegistry as any).fragments = new Map()

    const mergedConfig = new MergedConfig({})
    reloadRegistrySpy = jest.spyOn(RawConfigRegistry, 'reload').mockResolvedValue(undefined)
    readRegistrySpy = jest.spyOn(RawConfigRegistry, 'read').mockReturnValue(mergedConfig)
    reloadFactorySpy = jest.spyOn(ConfigurationFactory, 'reload').mockResolvedValue(undefined)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should call startWatch on watchable loaders during onModuleInit', () => {
    const loader = createWatchableLoader()

    const rc = createMockRuntimeConfig([loader])
    const manager = new WatchManager(rc)
    manager.onModuleInit()

    expect(loader.startWatch).toHaveBeenCalledTimes(1)
  })

  it('should skip loaders without startWatch', () => {
    const staticLoader: ConfigLoader = { load: mockLoad }
    const watchableLoader = createWatchableLoader()

    const rc = createMockRuntimeConfig([staticLoader, watchableLoader])
    const manager = new WatchManager(rc)
    manager.onModuleInit()

    expect(watchableLoader.startWatch).toHaveBeenCalledTimes(1)
  })

  it('should continue registering watchers when one loader throws', () => {
    const failingLoader = createWatchableLoader((() => {
      throw new Error('watch failed')
    }))
    const goodLoader = createWatchableLoader()

    const rc = createMockRuntimeConfig([failingLoader, goodLoader])
    const manager = new WatchManager(rc)
    manager.onModuleInit()

    expect(goodLoader.startWatch).toHaveBeenCalledTimes(1)
  })

  it('should call all disposers during onModuleDestroy', async () => {
    const disposer1 = jest.fn() as unknown as () => void
    const disposer2 = jest.fn() as unknown as () => void
    const loader1 = createWatchableLoader(
      jest.fn().mockReturnValue(disposer1) as unknown as WatchableConfigLoader['startWatch'],
    )
    const loader2 = createWatchableLoader(
      jest.fn().mockReturnValue(disposer2) as unknown as WatchableConfigLoader['startWatch'],
    )

    const rc = createMockRuntimeConfig([loader1, loader2])
    const manager = new WatchManager(rc)
    manager.onModuleInit()
    await manager.onModuleDestroy()

    expect(disposer1).toHaveBeenCalledTimes(1)
    expect(disposer2).toHaveBeenCalledTimes(1)
  })

  it('should do nothing on destroy when no watchers are registered', async () => {
    const rc = createMockRuntimeConfig([{ load: mockLoad }])
    const manager = new WatchManager(rc)
    manager.onModuleInit()
    await manager.onModuleDestroy()
  })

  it('should not throw when a disposer fails during destroy', async () => {
    const goodDisposer = jest.fn() as unknown as () => void
    const failingLoader = createWatchableLoader(
      jest.fn().mockReturnValue(() => {
        throw new Error('dispose failed')
      }) as unknown as WatchableConfigLoader['startWatch'],
    )
    const goodLoader = createWatchableLoader(
      jest.fn().mockReturnValue(goodDisposer) as unknown as WatchableConfigLoader['startWatch'],
    )

    const rc = createMockRuntimeConfig([failingLoader, goodLoader])
    const manager = new WatchManager(rc)
    manager.onModuleInit()

    await expect(manager.onModuleDestroy()).resolves.toBeUndefined()
    expect(goodDisposer).toHaveBeenCalledTimes(1)
  })

  it('should reload configuration through RawConfigRegistry and ConfigurationFactory', async () => {
    let capturedReloadCallback: (() => Promise<void>) | undefined
    const loader = createWatchableLoader(((reload: () => Promise<void>) => {
      capturedReloadCallback = reload
      return mockDisposer()
    }))

    const rc = createMockRuntimeConfig([loader])
    const manager = new WatchManager(rc)
    manager.onModuleInit()

    expect(capturedReloadCallback).toBeDefined()
    await capturedReloadCallback!()

    expect(reloadRegistrySpy).toHaveBeenCalledWith(loader)
    expect(readRegistrySpy).toHaveBeenCalled()
    expect(reloadFactorySpy).toHaveBeenCalledWith(rc, expect.any(MergedConfig))
  })
})
