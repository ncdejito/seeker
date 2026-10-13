import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const indexUrl = process.env.APPLY_KIT_URL || pathToFileURL(join(root, 'index.html')).href
const outDir = join(root, '..', 'docs', 'screenshots')
mkdirSync(outDir, { recursive: true })
console.log('Opening', indexUrl)

const shell = process.env.CHROMIUM_PATH
  || join(process.env.HOME || '', '.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell')
const browser = await chromium.launch({
  executablePath: shell,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--single-process', '--disable-gpu', '--no-zygote'],
})
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await context.newPage()
await page.goto(indexUrl)
await page.getByRole('button', { name: 'Load a 2-minute sample' }).click()
await page.locator('#score-box').waitFor({ state: 'visible' })
await page.locator('#prompt-box').waitFor({ state: 'visible' })

await page.locator('#app-company').fill('Iberia Insights')
await page.locator('#app-role').fill('Senior Data Engineer')
await page.locator('#app-link').fill('https://example.com/jobs/iberia-data')
await page.locator('#app-country').fill('Portugal')
await page.locator('#app-next').fill('Paste prompt into Claude tonight')
await page.locator('#app-notes').fill('Hybrid Lisbon · check EU Blue Card on official portal')
await page.getByRole('button', { name: 'Add to tracker' }).click()
await page.locator('#tracker-body').getByText('Iberia Insights').waitFor()

await page.screenshot({
  path: join(outDir, 'apply-kit-desktop.png'),
  fullPage: true,
})

await page.locator('#score-box').scrollIntoViewIfNeeded()
await page.screenshot({
  path: join(outDir, 'apply-kit-prompt.png'),
  fullPage: false,
})

await page.reload()
await page.locator('#tracker-body').getByText('Iberia Insights').waitFor()
const cvAfterReload = await page.locator('#cv-text').inputValue()
if (!cvAfterReload.includes('Maria Santos')) {
  throw new Error('Profile CV did not persist after reload')
}

const downloadPromise = page.waitForEvent('download')
await page.getByRole('button', { name: 'Export CSV' }).click()
const download = await downloadPromise
const csvPath = '/tmp/apply-kit-tracker-sample.csv'
await download.saveAs(csvPath)
console.log('CSV export saved to', csvPath)

await page.setViewportSize({ width: 390, height: 844 })
await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(300)
await page.screenshot({
  path: join(outDir, 'apply-kit-mobile.png'),
  fullPage: true,
})

await browser.close()
console.log('Wrote screenshots to', outDir)
