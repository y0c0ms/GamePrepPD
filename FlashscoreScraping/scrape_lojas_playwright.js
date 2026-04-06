import { chromium } from 'playwright';
import fs from 'fs';

async function scrapeStores() {
    console.log('🎭 Starting Playwright scraper for Pingo Doce stores...');
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    try {
        console.log('📡 Navigating to Pingo Doce lojas...');
        await page.goto('https://www.pingodoce.pt/lojas/', { waitUntil: 'networkidle', timeout: 60000 });

        // The stores are usually loaded into a global object for the map
        console.log('🧪 Extracting data from map engine...');
        let stores = await page.evaluate(() => {
            // Check common locations for store data in their WP theme
            const data = window.PD_map?.original_stores || window.PD?.stores || [];
            return data.map(s => ({
                id: s.id,
                name: s.name,
                lat: s.lat,
                lon: s.long || s.lon,
                address: s.address,
                postal_code: s.postal_code,
                city: s.county || s.city,
                district: s.district,
                opening_hours: s.opening_hours || s.schedule
            }));
        });

        // Fallback: search for something to trigger map load
        console.log('🔍 Searching Portugal to populate map...');
        await page.fill('#s', 'Portugal');
        await page.keyboard.press('Enter');
        
        // Wait for AJAX data to be stored in window variables
        await page.waitForTimeout(10000);

        console.log('🧪 Attempting extraction again...');
        stores = await page.evaluate(() => {
            const data = window.PD_map?.original_stores || window.PD?.stores || [];
            return data.map(s => ({
                id: s.id,
                name: s.name,
                lat: s.lat,
                lon: s.long || s.lon,
                address: s.address,
                postal_code: s.postal_code,
                city: s.county || s.city,
                district: s.district,
                opening_hours: s.opening_hours || s.schedule
            }));
        });

        if (stores.length > 0) {
            console.log(`✅ Success! Found ${stores.length} unique stores.`);
            fs.writeFileSync('pingo_doce_official.json', JSON.stringify(stores, null, 2));
            console.log('💾 Data saved to pingo_doce_official.json');
        } else {
            console.error('❌ Final attempt failed. Map data still not found.');
        }

    } catch (error) {
        console.error('❌ Playwright Error:', error.message);
    } finally {
        await browser.close();
    }
}

scrapeStores();
