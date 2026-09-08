const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('pageerror', err => console.log('PAGE_ERROR:', err.message));
  page.on('console', msg => { if (msg.type() === 'error') console.log('CONSOLE_ERROR:', msg.text()); });
  await page.goto('http://localhost:3000/');
  console.log('Home loaded');
  await page.click('a[href^="/patient"]');
  console.log('Clicked');
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
