import type { Plugin } from 'vite'
import { execSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { Agent as HttpAgent } from 'node:http'
import { Agent as HttpsAgent } from 'node:https'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import vueDevTools from 'vite-plugin-vue-devtools'

const require = createRequire(import.meta.url)
const fs = require('node:fs')
const archiver = require('archiver')

interface ThemeManifest {
  preview?: unknown
  version?: unknown
}

interface ArchiveEntry {
  name: string
  path: string
}

const themeJsonPath = resolve(__dirname, 'komari-theme.json')
const distPrefixPattern = /^dist\//
const devApiTarget = process.env.VITE_API_TARGET || 'http://127.0.0.1:25774'
const devApiIsHttps = devApiTarget.startsWith('https:')
const devProxyAgent = devApiIsHttps
  ? new HttpsAgent({ keepAlive: true, maxSockets: 8 })
  : new HttpAgent({ keepAlive: true, maxSockets: 8 })

function komariDevProxy(ws = false) {
  return {
    target: devApiTarget,
    changeOrigin: true,
    secure: devApiIsHttps,
    agent: devProxyAgent,
    timeout: 60_000,
    proxyTimeout: 60_000,
    headers: { Origin: devApiTarget },
    rewriteWsOrigin: true,
    ...(ws ? { ws: true } : {}),
  }
}

function disableKomariPwaInDev(): Plugin {
  return {
    name: 'disable-komari-pwa-in-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url?.split('?')[0]
        if (path !== '/registerSW.js') {
          next()
          return
        }

        res.setHeader('Content-Type', 'application/javascript')
        res.end('/* theme dev: do not install Komari admin service worker */')
      })
    },
  }
}

function readThemeManifest(): ThemeManifest {
  if (!existsSync(themeJsonPath))
    throw new Error('komari-theme.json not found')

  return JSON.parse(readFileSync(themeJsonPath, 'utf-8')) as ThemeManifest
}

function getThemeVersion(): string {
  const version = readThemeManifest().version

  if (typeof version !== 'string' || !version.trim())
    throw new TypeError('komari-theme.json does not contain a top-level string version field')

  return version.trim()
}

function getCommitHash(): string {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
  }
  catch {
    return 'unknown'
  }
}

const themeAssetBase = process.env.VITE_THEME_ASSET_BASE || `/themes/Starfield/dist-${getCommitHash()}/`

function getSourceDate(): Date {
  const configuredEpoch = process.env.SOURCE_DATE_EPOCH
  const epoch = configuredEpoch
    ? Number(configuredEpoch)
    : Number(execSync('git show -s --format=%ct HEAD', { encoding: 'utf-8' }).trim())

  if (!Number.isInteger(epoch) || epoch < 315532800)
    throw new Error(`Invalid SOURCE_DATE_EPOCH: ${configuredEpoch ?? epoch}`)

  return new Date(epoch * 1000)
}

function listArchiveFiles(root: string, prefix: string): ArchiveEntry[] {
  const entries: ArchiveEntry[] = []

  for (const name of readdirSync(root).sort((left, right) => left.localeCompare(right, 'en'))) {
    const path = resolve(root, name)
    const archiveName = `${prefix}/${name}`

    if (statSync(path).isDirectory())
      entries.push(...listArchiveFiles(path, archiveName))
    else
      entries.push({ name: archiveName, path })
  }

  return entries
}

/**
 * Vite 插件：构建后打包 Komari 主题 Zip
 * theme.zip
 * ├── komari-theme.json
 * ├── preview.png
 * └── dist/
 */
function komariThemeZip(): Plugin {
  return {
    name: 'komari-theme-zip',
    apply: 'build',
    closeBundle: async () => {
      const commitHash = getCommitHash()
      const immutableAssetDir = `dist-${commitHash}`
      const zipFileName = `komari-theme-Starfield-build-${commitHash}.zip`
      const distDir = resolve(__dirname, 'dist')
      const previewPath = resolve(__dirname, 'docs/preview.png')
      const outputPath = resolve(__dirname, zipFileName)
      const sourceDate = getSourceDate()
      const themeManifest = readThemeManifest()
      const manifestPreviewName = typeof themeManifest.preview === 'string' && themeManifest.preview.trim()
        ? themeManifest.preview.trim()
        : 'preview.png'

      if (!existsSync(distDir)) {
        console.log('[komari-theme-zip] dist directory not found, skipping zip creation')
        return
      }

      const output = fs.createWriteStream(outputPath)
      const archive = archiver('zip', { zlib: { level: 9 } })

      return new Promise((resolve, reject) => {
        output.on('close', () => {
          const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2)
          console.log(`[komari-theme-zip] Created ${zipFileName} (${sizeMB} MB)`)
          resolve(undefined)
        })

        archive.on('error', (err: Error) => {
          console.error('[komari-theme-zip] Error:', err)
          reject(err)
        })

        archive.pipe(output)

        const appendFile = (path: string, name: string) => {
          archive.append(readFileSync(path), {
            name,
            date: sourceDate,
            mode: 0o644,
          })
        }

        appendFile(themeJsonPath, 'komari-theme.json')
        // Attribution must accompany binary distributions, not just source.
        for (const name of ['LICENSE', 'THIRD_PARTY_NOTICES.md', 'ASSET_PROVENANCE.md', 'CANDIDATE_NOTICES.md', 'NASA_TEXTURE.md'])
          appendFile(join(__dirname, name), name)
        for (const entry of listArchiveFiles(join(__dirname, 'docs/asset-evidence'), 'docs/asset-evidence'))
          appendFile(entry.path, entry.name)

        if (existsSync(previewPath)) {
          appendFile(previewPath, 'preview.png')
          if (manifestPreviewName !== 'preview.png') {
            appendFile(previewPath, manifestPreviewName)
          }
        }

        // Komari 1.5+ always serves /admin and /terminal from its built-in
        // frontend. Do not ship the legacy embedded admin bridge: otherwise
        // direct /admin-app access or stale links can reopen the old console.
        for (const entry of listArchiveFiles(distDir, 'dist')) {
          if (!entry.name.startsWith('dist/admin-app/')) {
            appendFile(entry.path, entry.name)
            appendFile(entry.path, entry.name.replace(distPrefixPattern, `${immutableAssetDir}/`))
          }
        }

        archive.finalize()
      })
    },
  }
}

export default defineConfig({
  base: themeAssetBase,
  define: {
    __APP_ROUTER_BASE__: JSON.stringify('/'),
    __BUILD_VERSION__: JSON.stringify(getThemeVersion()),
    __BUILD_GIT_HASH__: JSON.stringify(getCommitHash()),
  },
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
    disableKomariPwaInDev(),
    komariThemeZip(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': komariDevProxy(true),
      '/themes': komariDevProxy(),
      // Komari 1.5 admin HTML lives on /admin, but its JS/CSS are rooted at /assets.
      '/admin': komariDevProxy(true),
      '/terminal': komariDevProxy(true),
      '/assets': komariDevProxy(),
      '/manifest.webmanifest': komariDevProxy(),
    },
  },
  preview: {
    // Preview serves the built theme's own assets. Keep API/theme requests
    // available for local integration, but let SPA routes such as /admin
    // fall back to the built entry so the compatibility worker can redirect
    // them without requiring a running Komari backend.
    proxy: {
      '/api': komariDevProxy(true),
      '/themes': komariDevProxy(),
      '/manifest.webmanifest': komariDevProxy(),
    },
  },
  build: {
    target: ['es2018', 'safari15.4'],
    cssTarget: 'safari15.4',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'echarts': ['echarts', 'vue-echarts'],
          'emerald-three': ['three'],
          'realistic-globe': ['globe.gl'],
          'reka-ui': ['reka-ui'],
          'vueuse': ['@vueuse/core'],
          'v3-services': [
            './src/services/history.service.ts',
            './src/services/metrics.service.ts',
            './src/services/request.service.ts',
            './src/services/cache.service.ts',
            './src/utils/osImageHelper.ts',
            './src/utils/metricSeries.ts',
            './src/composables/useNodePingDisplay.ts',
          ],
        },
      },
    },
  },
})
