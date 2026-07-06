import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3001';
const SCREENSHOTS = 'C:\\Users\\ANBALR~1\\AppData\\Local\\Temp\\';

async function shot(page, name) {
  const p = `${SCREENSHOTS}${name}.png`;
  await page.screenshot({ path: p, fullPage: false });
  console.log(`[screenshot] ${p}`);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

// Collect console errors
const consoleErrors = [];
page.on('console', msg => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});

const networkErrors = [];
page.on('requestfailed', req => {
  networkErrors.push(`${req.method()} ${req.url()} → ${req.failure()?.errorText}`);
});

// ── STEP 1: Load the app ──────────────────────────────────────────────
console.log('\n=== STEP 1: Load the app ===');
await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 });
await shot(page, '01-initial-load');
console.log('URL after load:', page.url());
console.log('Title:', await page.title());

// ── STEP 2: Check if we're on login or dashboard ───────────────────────
console.log('\n=== STEP 2: Detect auth state ===');
const currentUrl = page.url();
const isLogin = currentUrl.includes('login') || currentUrl.includes('signin') || currentUrl.includes('auth');
console.log('Is on login page:', isLogin);

if (isLogin) {
  // Try to find login fields
  const hasUsername = await page.locator('input[type="text"], input[name="username"], input[name="email"], input[id="username"]').count();
  const hasPassword = await page.locator('input[type="password"]').count();
  console.log('Login form inputs found:', { username: hasUsername, password: hasPassword });
  await shot(page, '02-login-page');
}

// ── STEP 3: Navigate directly to permits page ──────────────────────────
console.log('\n=== STEP 3: Navigate to vacations-permits ===');
await page.goto(`${BASE_URL}/page/vacations-permits`, { waitUntil: 'networkidle', timeout: 20000 });
await shot(page, '03-permits-page');
console.log('URL:', page.url());

// ── STEP 4: Look for the module structure ──────────────────────────────
console.log('\n=== STEP 4: Inspect page structure ===');
const bodyText = await page.locator('body').innerText().catch(() => 'could not get text');
console.log('Body text (first 500 chars):', bodyText.slice(0, 500));

// Check for tabs (Permisos / Vacaciones)
const tabsVisible = await page.locator('[role="tab"]').count();
console.log('Tabs found:', tabsVisible);
if (tabsVisible > 0) {
  const tabTexts = await page.locator('[role="tab"]').allInnerTexts();
  console.log('Tab labels:', tabTexts);
}

// ── STEP 5: Look for FileUpload component (permission type selector) ────
console.log('\n=== STEP 5: Check for type selector (Permiso/Incapacidad/Duelo) ===');
const selects = await page.locator('select, [role="combobox"]').count();
console.log('Select/combobox elements:', selects);
const buttons = await page.locator('button').allInnerTexts();
console.log('Buttons visible:', buttons.slice(0, 10));

await shot(page, '04-module-structure');

// ── STEP 6: Try to interact with the permits tab ────────────────────────
console.log('\n=== STEP 6: Try clicking permits tab ===');
const permitTab = page.locator('[role="tab"]').filter({ hasText: /permiso/i }).first();
const permitTabCount = await permitTab.count();
console.log('Permit tab found:', permitTabCount);
if (permitTabCount > 0) {
  await permitTab.click();
  await page.waitForTimeout(1000);
  await shot(page, '05-permits-tab-active');
}

// ── STEP 7: Check for upload area ─────────────────────────────────────
console.log('\n=== STEP 7: Check for file upload area ===');
const uploadArea = page.locator('text=Arrastra y suelta').first();
const hasUploadArea = await uploadArea.count();
console.log('Upload area visible:', hasUploadArea > 0);

const fileInput = page.locator('input[type="file"]').first();
const hasFileInput = await fileInput.count();
console.log('File input exists (may be hidden):', hasFileInput > 0);

// ── STEP 8: Check for incapacidad option ──────────────────────────────
console.log('\n=== STEP 8: Try selecting "Incapacidad" type ===');
const incapacidadOption = page.locator('text=/incapacidad/i').first();
const incapacidadCount = await incapacidadOption.count();
console.log('Incapacidad option found:', incapacidadCount);

// Check combobox / radio options
const radioOptions = await page.locator('[type="radio"]').count();
console.log('Radio options:', radioOptions);

// ── STEP 9: Try to upload a test image if file input exists ────────────
if (hasFileInput > 0 && hasUploadArea > 0) {
  console.log('\n=== STEP 9: Upload a test image ===');
  // Create a minimal 1x1 PNG (smallest valid PNG)
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const pngBuffer = Buffer.from(pngBase64, 'base64');
  const tmpFile = `${SCREENSHOTS}test-imagen.png`;
  writeFileSync(tmpFile, pngBuffer);

  await fileInput.setInputFiles(tmpFile);
  await page.waitForTimeout(1000);
  await shot(page, '06-after-image-upload');

  const fileSelected = await page.locator('text=/\.png/i').count();
  console.log('File name shown in UI:', fileSelected > 0);
  const previewImg = await page.locator('img[alt]').count();
  console.log('Preview image rendered:', previewImg > 0);
} else {
  console.log('\n=== STEP 9: SKIP upload (no visible upload area or not on correct sub-section) ===');
  await shot(page, '06-no-upload-area');
}

// ── STEP 10: Check vacation tab + signature pad ────────────────────────
console.log('\n=== STEP 10: Check Vacaciones tab and SignaturePad ===');
const vacTab = page.locator('[role="tab"]').filter({ hasText: /vacacion/i }).first();
const vacTabCount = await vacTab.count();
console.log('Vacation tab found:', vacTabCount);
if (vacTabCount > 0) {
  await vacTab.click();
  await page.waitForTimeout(1000);
  await shot(page, '07-vacations-tab');
  const canvas = await page.locator('canvas').count();
  console.log('Canvas (SignaturePad) found:', canvas > 0);
}

// ── FINAL REPORT ────────────────────────────────────────────────────────
console.log('\n=== CONSOLE ERRORS ===');
if (consoleErrors.length === 0) {
  console.log('None');
} else {
  consoleErrors.forEach(e => console.log(' ERR:', e));
}

console.log('\n=== NETWORK FAILURES ===');
if (networkErrors.length === 0) {
  console.log('None');
} else {
  networkErrors.forEach(e => console.log(' FAIL:', e));
}

await browser.close();
console.log('\nDone.');
