const resolutions = [
  { matcher: /\.js$/i, extensions: ['.ts', '.tsx'] },
  { matcher: /\.jsx$/i, extensions: ['.ts', '.tsx', '.js'] },
  { matcher: /\.cjs$/i, extensions: ['.cts'] },
  { matcher: /\.mjs$/i, extensions: ['.mts'] },
]

function resolver(
  path: string,
  options: { defaultResolver: (path: string, options: unknown) => string },
): string {
  const resolution = resolutions.find(({ matcher }) => matcher.test(path))
  if (resolution) {
    for (const extension of resolution.extensions) {
      try {
        return options.defaultResolver(path.replace(resolution.matcher, extension), options)
      } catch {
        continue
      }
    }
  }
  return options.defaultResolver(path, options)
}

module.exports = resolver
