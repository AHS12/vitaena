/**
 * Test script for verifying Puppeteer setup in Docker
 * Run this inside the Docker container to ensure Puppeteer/Chromium works correctly
 * 
 * Usage:
 * 1. docker exec -it vitaena-app sh
 * 2. node scripts/test-puppeteer.mjs
 */

import puppeteer from 'puppeteer';

// Parse puppeteer args from env or use defaults
function getPuppeteerArgs() {
  if (process.env.PUPPETEER_ARGS) {
    return process.env.PUPPETEER_ARGS.split(' ');
  }
  return [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
  ];
}

async function testPuppeteer() {
  console.log('Starting Puppeteer test...');
  console.log('Environment:', {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    nodeEnv: process.env.NODE_ENV,
  });

  let browser = null;
  let page = null;

  try {
    const puppeteerArgs = getPuppeteerArgs();
    console.log('Launching browser with args:', puppeteerArgs);

    // Launch the browser
    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: puppeteerArgs,
      timeout: 30000,
    });

    console.log('Browser launched successfully');

    // Create a new page
    page = await browser.newPage();
    console.log('Page created successfully');

    // Navigate to a test page
    await page.goto('https://example.com', {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });
    console.log('Navigation successful');

    // Get page title
    const title = await page.title();
    console.log('Page title:', title);

    // Generate PDF
    console.log('Generating test PDF...');
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
    });
    console.log('PDF generated successfully, size:', pdf.length);

    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Cleanup
    if (page) {
      await page.close();
      console.log('Page closed');
    }
    if (browser) {
      await browser.close();
      console.log('Browser closed');
    }
  }
}

testPuppeteer().catch(console.error);
