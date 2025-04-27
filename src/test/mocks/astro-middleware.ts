// Stub for astro:middleware
export function defineMiddleware<M extends (...args: unknown[]) => unknown>(middleware: M): M {
  return middleware;
}
