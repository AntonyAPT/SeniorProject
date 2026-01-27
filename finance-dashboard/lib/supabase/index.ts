// Re-export with renamed functions to avoid naming conflicts
export { createClient as createBrowserClient } from './client'
export { createClient as createServerClient } from './server'
export { updateSession } from './proxy'