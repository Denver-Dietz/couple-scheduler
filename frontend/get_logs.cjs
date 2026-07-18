const puppeteer = require('puppeteer');
(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    page.on('console', msg => console.log('LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));
    page.on('response', response => {
      if (!response.ok()) {
        console.log('RESPONSE NOT OK:', response.url(), response.status());
      }
    });

    await page.goto('http://127.0.0.1:8080', {waitUntil: 'domcontentloaded', timeout: 20000});
    await new Promise(r => setTimeout(r, 1000));
    
    console.log("Clicking Bucket List tab");
    const tabs = await page.$$('.nav-tab');
    for (const tab of tabs) {
      const text = await page.evaluate(el => el.textContent, tab);
      if (text.includes('Someday Board')) {
        await tab.click();
        break;
      }
    }
    
    await new Promise(r => setTimeout(r, 1000));
    
    console.log("Clicking Destinations sub-tab");
    const subtabs = await page.$$('.btn');
    for (const tab of subtabs) {
      const text = await page.evaluate(el => el.textContent, tab);
      if (text.includes('Destinations')) {
        await tab.click();
        break;
      }
    }

    await new Promise(r => setTimeout(r, 2000));
    console.log("Taking debug screenshot");
    await page.screenshot({ path: '../screenshot_bucket_debug.png' });

    console.log("Searching and creating a pin");
    const searchInput = await page.$('.search-input');
    if (searchInput) {
      await page.type('.search-input', 'Tokyo');
      await new Promise(r => setTimeout(r, 2000));
    
    const results = await page.$$('.search-item');
    if (results.length > 0) {
      await results[0].click();
      await new Promise(r => setTimeout(r, 1000));
      
      const saveBtn = await page.$('.save-panel .btn-primary');
      if (saveBtn) {
         console.log("Clicking Save Pin");
         await saveBtn.click();
      } else {
         console.log("Save Pin button not found!");
      }
    } else {
      console.log("No search results found!");
    }
    } // Close if (searchInput)
    
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: '../screenshot_bucket_error.png' });
    
    await browser.close();
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
})();
