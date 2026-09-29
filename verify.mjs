import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Listen for console messages to fail if there are any
    page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
            console.log(`PAGE LOG: ${msg.type()}: ${msg.text()}`);
        }
    });

    console.log('Navigating to http://localhost:3000/');
    await page.goto('http://localhost:3000/');

    // Wait for title screen to render
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'verify_title.png' });
    console.log('Took title screen screenshot');

    // Start chapter 1
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    // Select first chapter
    await page.keyboard.press('Enter');
    console.log('Started Chapter 1');

    await page.waitForTimeout(10000);
    await page.screenshot({ path: 'verify_ch1_10s.png' });
    console.log('Took Ch1 10s screenshot');

    await page.waitForTimeout(20000);
    await page.screenshot({ path: 'verify_ch1_30s.png' });
    console.log('Took Ch1 30s screenshot');

    await page.waitForTimeout(30000);
    await page.screenshot({ path: 'verify_ch1_60s.png' });
    console.log('Took Ch1 60s screenshot');

    await browser.close();
    console.log('Done');
})();