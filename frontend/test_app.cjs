const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  await page.click('button.btn');
  
  await new Promise(r => setTimeout(r, 2000));
  
  await page.screenshot({ path: 'C:/Users/Denver/.gemini/antigravity/brain/f69d3f16-0064-4903-b2a8-95ae32219a53/screenshot.png' });
  
  // Also dump the HTML body
  const html = await page.evaluate(() => document.body.innerHTML);
  const fs = require('fs');
  fs.writeFileSync('C:/Users/Denver/.gemini/antigravity/brain/f69d3f16-0064-4903-b2a8-95ae32219a53/body.html', html);
  
  await browser.close();
})();
