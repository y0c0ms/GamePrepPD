import fs from 'fs';
import path from 'path';

const inputFile = 'c:/Users/manuesantos/Projetos/ConditionalBeer/lojasPingoDoce';
const outputFile = 'c:/Users/manuesantos/Projetos/ConditionalBeer/pingo_doce_lojas.json';

function decodeEntities(text) {
    if (!text) return '';
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

try {
    const htmlContent = fs.readFileSync(inputFile, 'utf-8');

    // Regex to match each store block
    const cardRegex = /<a[^>]+class="js-map-sidebar-card[^>]+data-store-id="(\d+)"[^>]*>([\s\S]*?)<\/a>/g;
    
    let match;
    const allStores = [];

    while ((match = cardRegex.exec(htmlContent)) !== null) {
        const storeId = match[1];
        const contentArea = match[2];

        // Extract fields using Regex - using \s+ and [\s\S] to handle newlines
        const nameMatch = /<div class="name">([\s\S]*?)<\/div>/.exec(contentArea);
        const addressMatch = /<div class="address">([\s\S]*?)<\/div>/.exec(contentArea);
        const postalCodeMatch = /<div class="postal-code">([\s\S]*?)<\/div>/.exec(contentArea);
        
        // Improved schedule time regex to handle potential newlines in the tag and content
        const timeMatch = /<span[\s\S]*?class="js-current-schedule[^>]*>([\s\S]*?)<\/span>/.exec(contentArea);

        const storeData = {
            id: storeId,
            name: nameMatch ? decodeEntities(nameMatch[1]) : 'Desconhecido',
            address: addressMatch ? decodeEntities(addressMatch[1]) : 'Desconhecido',
            postal_code: postalCodeMatch ? decodeEntities(postalCodeMatch[1]) : 'Desconhecido',
            schedule: timeMatch ? decodeEntities(timeMatch[1]) : 'Desconhecido'
        };

        allStores.push(storeData);
    }

    // Save all stores to a single file
    fs.writeFileSync(outputFile, JSON.stringify(allStores, null, 2));

    console.log(`✅ Successo! Foram extraídas ${allStores.length} lojas para o arquivo: ${outputFile}`);

} catch (error) {
    console.error('❌ Erro durante o processamento:', error.message);
}
