import { defineEventHandler, getQuery, sendError } from 'h3';
import puppeteer from 'puppeteer';

const queue = [];
let isProcessing = false;

async function processQueue() {
  if (isProcessing || queue.length === 0) return;

  isProcessing = true;
  const { url, resolve, reject } = queue.shift();

  if (!url || !url.startsWith('http')) {
    reject(new Error('Invalid URL'));
    isProcessing = false;
    processQueue();
    return;
  }

  let browser = null;
  try {
    browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process',
        '--disable-gpu',
        '--no-zygote',
        '--disable-accelerated-2d-canvas'
      ],
      defaultViewport: { width: 1280, height: 960 }
    });

    const page = await browser.newPage();
    await page.setRequestInterception(true);

    page.on('request', (req) => {
      if (['font', 'audio', 'video'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(url, { timeout: 15000, waitUntil: 'domcontentloaded' });

    await new Promise((r) => setTimeout(r, 1000));

    const screenshot = await page.screenshot({
      type: 'jpeg',
      quality: 70,
      omitBackground: false
    });

    resolve(screenshot);
  } catch (error) {
    console.error('Screenshot error:', error);
    reject(error);
  } finally {
    if (browser) await browser.close();
    isProcessing = false;
    processQueue();
  }
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const url = query.url;

  if (!url || !/^https?:\/\//.test(url)) {
    return sendError(event, new Error('Valid URL parameter is required'), 400);
  }

  try {
    const screenshot = await new Promise((resolve, reject) => {
      queue.push({ url, resolve, reject });
      processQueue();
    });

    event.node.res.setHeader('Content-Type', 'image/jpeg');
    event.node.res.setHeader('Cache-Control', 'public, max-age=86400');

    return screenshot;
  } catch (error) {
    return sendError(event, new Error('Screenshot generation failed'), 500);
  }
});
