import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { LoaderWatchOptions } from '../types/loader-watch-options.js'
import type { LoadRawConfigFn } from '../types/config-loader.js'

type WatcherHandler = (...args: any[]) => void

const chokidarHandlers = new Map<string, WatcherHandler>()
const mockClose = jest.fn<() => Promise<void>>()

jest.mock('chokidar', () => {
  const handlers = chokidarHandlers
  const close = mockClose
  const watcher = {
    on(event: string, handler: WatcherHandler) {
      handlers.set(event, handler)
      return watcher
    },
    close,
  }
  return {
    __esModule: true,
    default: { watch: jest.fn<() => typeof watcher>().mockReturnValue(watcher) },
  }
})

const mockStat = jest.fn<() => Promise<{ mtimeMs: number }>>()
jest.mock('fs/promises', () => ({
  stat: mockStat,
  access: jest.fn<() => Promise<void>>(),
}))

const mockFsExist = jest.fn<() => Promise<boolean>>()
jest.mock('../utils/fs-exists.js', () => ({
  fsExist: mockFsExist,
}))

import { createFileWatcher, CreateFileWatcherOptions } from './create-file-watcher.js'

function createOptions(watchOptions: LoaderWatchOptions = {}): CreateFileWatcherOptions {
  return {
    filepath: '/test/config.yaml',
    watchOptions,
    loader: ((() => Promise.resolve({ key: 'value' })) as LoadRawConfigFn),
    loggerName: 'test-watcher',
  }
}

describe('createFileWatcher', () => {
  beforeEach(() => {
    chokidarHandlers.clear()
    mockClose.mockResolvedValue(undefined)
    mockFsExist.mockResolvedValue(true)
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  describe('watch mode (default)', () => {
    it('should create a chokidar watcher and listen for change and error events', () => {
      createFileWatcher(createOptions(), () => {})

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const chokidar = jest.requireMock('chokidar') as any
      expect(chokidar.default.watch).toHaveBeenCalledWith(
        '/test/config.yaml',
        expect.objectContaining({ persistent: true, ignoreInitial: true }),
      )
      expect(chokidarHandlers.has('change')).toBe(true)
      expect(chokidarHandlers.has('error')).toBe(true)
    })

    it('should call onReload after debounce when file changes', async () => {
      let reloadCount = 0
      createFileWatcher(createOptions({ debounceMs: 100 }), () => {
        reloadCount++
      })

      chokidarHandlers.get('change')!()
      expect(reloadCount).toBe(0)
      await jest.advanceTimersByTimeAsync(100)
      expect(reloadCount).toBe(1)
    })

    it('should call onChange before onReload when onChange is set', async () => {
      const callOrder: string[] = []
      const onChange = (): void => {
        callOrder.push('onChange')
      }
      const onReload = (): void => {
        callOrder.push('onReload')
      }
      createFileWatcher(createOptions({ onChange, debounceMs: 50 }), onReload)

      chokidarHandlers.get('change')!()
      await jest.advanceTimersByTimeAsync(50)

      expect(callOrder).toEqual(['onChange', 'onReload'])
    })

    it('should call onError when reload throws', async () => {
      const errors: Error[] = []
      const onError = (err: Error): void => {
        errors.push(err)
      }
      createFileWatcher(
        createOptions({ onError, debounceMs: 50 }),
        () => {
          throw new Error('reload failed')
        },
      )

      chokidarHandlers.get('change')!()
      await jest.advanceTimersByTimeAsync(50)

      expect(errors.length).toBe(1)
      expect(errors[0].message).toBe('reload failed')
    })

    it('should call onError when watcher emits error', () => {
      const errors: Error[] = []
      const onError = (err: Error): void => {
        errors.push(err)
      }
      createFileWatcher(createOptions({ onError }), () => {})

      chokidarHandlers.get('error')!(new Error('watcher error'))
      expect(errors.length).toBe(1)
    })

    it('should close watcher and clear debounce timer on dispose', async () => {
      let reloadCount = 0
      const dispose = createFileWatcher(
        createOptions({ debounceMs: 100 }),
        () => {
          reloadCount++
        },
      )

      chokidarHandlers.get('change')!()
      await dispose()

      await jest.advanceTimersByTimeAsync(100)
      expect(reloadCount).toBe(0)
      expect(mockClose).toHaveBeenCalledTimes(1)
    })

    it('should debounce multiple rapid changes into one reload', async () => {
      let reloadCount = 0
      createFileWatcher(createOptions({ debounceMs: 200 }), () => {
        reloadCount++
      })

      const changeHandler = chokidarHandlers.get('change')!
      changeHandler()
      await jest.advanceTimersByTimeAsync(100)
      changeHandler()
      await jest.advanceTimersByTimeAsync(100)
      changeHandler()
      await jest.advanceTimersByTimeAsync(200)

      expect(reloadCount).toBe(1)
    })
  })

  describe('interval mode', () => {
    it('should trigger onReload when file mtime changes', async () => {
      let reloadCount = 0
      mockStat.mockResolvedValue({ mtimeMs: 1000 })

      createFileWatcher(
        createOptions({ type: 'interval', intervalMs: 100 }),
        () => {
          reloadCount++
        },
      )

      // Initial mtime setup
      await jest.advanceTimersByTimeAsync(0)

      // First interval: mtime same → no reload
      await jest.advanceTimersByTimeAsync(100)
      expect(reloadCount).toBe(0)

      // Change mtime → reload
      mockStat.mockResolvedValue({ mtimeMs: 2000 })
      await jest.advanceTimersByTimeAsync(100)

      expect(reloadCount).toBe(1)
    })

    it('should skip check when file does not exist', async () => {
      let reloadCount = 0
      mockFsExist.mockResolvedValue(false)

      createFileWatcher(
        createOptions({ type: 'interval', intervalMs: 100 }),
        () => {
          reloadCount++
        },
      )

      await jest.advanceTimersByTimeAsync(100)
      expect(reloadCount).toBe(0)
    })

    it('should clear interval on dispose', async () => {
      let reloadCount = 0
      mockStat.mockResolvedValue({ mtimeMs: 1000 })

      const dispose = createFileWatcher(
        createOptions({ type: 'interval', intervalMs: 100 }),
        () => {
          reloadCount++
        },
      )
      void dispose()

      mockStat.mockResolvedValue({ mtimeMs: 2000 })
      await jest.advanceTimersByTimeAsync(200)
      expect(reloadCount).toBe(0)
    })

    it('should call onError when stat throws', async () => {
      const errors: Error[] = []
      const onError = (err: Error): void => {
        errors.push(err)
      }
      mockStat.mockResolvedValue({ mtimeMs: 1000 })

      createFileWatcher(
        createOptions({ type: 'interval', intervalMs: 100, onError }),
        () => {},
      )

      // Initial mtime setup
      await jest.advanceTimersByTimeAsync(0)

      // Next tick: stat fails
      mockStat.mockRejectedValue(new Error('stat failed'))
      await jest.advanceTimersByTimeAsync(100)

      expect(errors.length).toBe(1)
      expect(errors[0].message).toBe('stat failed')
    })
  })
})
