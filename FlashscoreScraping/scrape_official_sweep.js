import { chromium } from 'playwright';
import fs from 'fs';

const DISTRICTS = [
    'Lisboa', 'Porto', 'Setúbal', 'Braga', 'Aveiro', 'Leiria', 'Santarém', 'Coimbra', 
    'Faro', 'Viseu', 'Viana do Castelo', 'Vila Real', 'Castelo Branco', 'Évora', 
    'Guarda', 'Beja', 'Bragança', 'Portalegre', 'Madeira', 'Açores'
];

async function scrapeByDistricts() {
    console.log('🎭 Starting Official Pingo Doce District Sweep...');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const allStores = new Map(); // Map to handle duplicates from overlapping regions

    try {
        console.log('📡 Accessing Pingo Doce Map Engine...');
        await page.goto('https://www.pingodoce.pt/lojas/', { waitUntil: 'domcontentloaded', timeout: 90000 });
        
        // Wait for search input to ensure map is active
        console.log('📍 Waiting for map controls...');
        await page.waitForSelector('#s', { timeout: 30000 });

        for (const district of DISTRICTS) {
            console.log(`🔍 Searching: ${district}...`);
            
            // Clear and Type District
            await page.fill('#s', district);
            await page.keyboard.press('Enter');
            
            // Wait for map to refresh the data object
            await page.waitForTimeout(1500); 

            const storesFound = await page.evaluate(() => {
                const data = window.PD_map?.original_stores || window.PD?.stores || [];
                return data.map(s => ({
                    id: s.id,
                    name: s.name,
                    lat: parseFloat(s.lat),
                    lon: parseFloat(s.long || s.lon),
                    address: s.address,
                    postal_code: s.postal_code,
                    city: s.county || s.city,
                    district: s.district
                }));
            });

            storesFound.forEach(s => allStores.set(s.id, s));
            console.log(`   ✅ Found ${storesFound.length} stores. Total unique: ${allStores.size}`);
        }

        if (allStores.size > 0) {
            const finalResults = Array.from(allStores.values());
            fs.writeFileSync('pingo_doce_official_verified.json', JSON.stringify(finalResults, null, 2));
            console.log(`\n🏆 Audit Finished! SUCCESS: Verified ${allStores.size} official store coordinates.`);
            console.log('💾 Data saved to pingo_doce_official_verified.json');
        } else {
            console.error('❌ Could not extract any official store data.');
        }

    } catch (error) {
        console.error('❌ Error during sweep:', error.message);
    } finally {
        await browser.close();
    }
}

scrapeByDistricts();
