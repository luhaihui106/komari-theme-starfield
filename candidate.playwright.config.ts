import process from 'node:process'
import { defineConfig } from '@playwright/test'
import config from './playwright.config'

export default defineConfig({
  ...config,
  projects: [{ name: 'chromium', use: { browserName: 'chromium', launchOptions: { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] } } }],
})
