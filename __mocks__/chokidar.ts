const mockWatcher = {
  on: () => mockWatcher,
  close: async () => {},
}

export function watch(): typeof mockWatcher {
  return mockWatcher
}

export default { watch }
