import fs from 'fs';

const BASE_URL = 'https://www.pingodoce.pt/wp-content/themes/pingodoce/ajax/pd-ajax.php?action=pd_stores_get_stores&l=';

// Larger regions to cover the whole country
const REGIONS = [
    'Lisboa', 'Porto', 'Braga', 'Faro', 'Coimbra', 'Setubal', 'Evora', 
    'Funchal', 'Ponta Delgada', 'Viseu', 'Guarda', 'Castelo Branco',
    'Aveiro', 'Leiria', 'Santarém', 'Portalegre', 'Beja', 'Viana do Castelo', 'Vila Real', 'Bragança'
];

async function fetchAllStores() {
    console.log('🚀 Starting official Pingo Doce coordinate fetch...');
    const allStores = new Map();

    for (const region of REGIONS) {
        console.log(`📡 Fetching stores for region: ${region}...`);
        try {
            const response = await fetch(`${BASE_URL}${encodeURIComponent(region)}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Referer': 'https://www.pingodoce.pt/lojas/'
                }
            });
            
            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error(`❌ Region ${region} returned non-JSON response. Body start: ${text.substring(0, 100)}`);
                continue;
            }
            
            if (data && data.stores) {
                console.log(`✅ Found ${data.stores.length} stores in ${region}`);
                data.stores.forEach(store => {
                    // Use store ID as key to prevent duplicates
                    allStores.set(store.id, {
                        id: store.id,
                        name: store.name,
                        lat: parseFloat(store.lat),
                        lon: parseFloat(store.long),
                        address: store.address,
                        postal_code: store.postal_code,
                        schedule: store.schedule,
                        opening_hours: store.opening_hours || 'N/A',
                        url: store.url
                    });
                });
            }
        } catch (error) {
            console.error(`❌ Error fetching ${region}:`, error.message);
        }
        // Small delay to be polite to the server
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    const finalStores = Array.from(allStores.values());
    console.log(`\n🎉 Total unique stores found: ${finalStores.length}`);

    fs.writeFileSync(
        'pingo_doce_official.json', 
        JSON.stringify(finalStores, null, 2),
        'utf-8'
    );
    console.log('💾 Data saved to pingo_doce_official.json');
}

fetchAllStores();
