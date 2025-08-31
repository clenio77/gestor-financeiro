declare module 'next-pwa' {
  import { NextConfig } from 'next'
  
  interface PWAConfig {
    dest?: string
    register?: boolean
    skipWaiting?: boolean
    disable?: boolean
    runtimeCaching?: Array<{
      urlPattern: RegExp | string | ((options: { url: URL; request: Request }) => boolean)
      handler: string
      method?: string
      options?: {
        cacheName?: string
        expiration?: {
          maxEntries?: number
          maxAgeSeconds?: number
        }
        rangeRequests?: boolean
        networkTimeoutSeconds?: number
      }
    }>
  }
  
  function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig
  
  export default withPWA
}
