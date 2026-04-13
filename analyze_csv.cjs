const fs = require('fs');
const csv = require('fs').readFileSync;

function parseCSV(filePath) {
    const content = csv(filePath, 'utf8');
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
        const values = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim().replace(/^"|"$/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim().replace(/^"|"$/g, ''));
        const obj = {};
        headers.forEach((h, i) => {
            obj[h] = values[i];
        });
        return obj;
    });
}

function analyze() {
    console.log('--- Analyzing GID 0 ---');
    const gid0 = parseCSV('gid_0.csv');
    const gid0Counts = {};
    gid0.forEach(row => {
        const year = row['Job Year'];
        if (year) {
            gid0Counts[year] = (gid0Counts[year] || 0) + 1;
        }
    });
    console.log('GID 0 Counts:', gid0Counts);

    console.log('\n--- Analyzing GID 1626127241 ---');
    const gid162 = parseCSV('gid_1626127241.csv');
    const gid162Counts = {};
    
    // Sample some dates to see format
    console.log('Sample dates from GID 1626127241 "Date of leaving - Placed":');
    gid162.slice(0, 10).forEach(row => console.log(`"${row['Date of leaving - Placed']}"`));

    gid162.forEach(row => {
        const dateStr = row['Date of leaving - Placed'];
        if (dateStr) {
            // Extract year from formats like '08-Nov-2024' or '5/27/2024'
            const match = dateStr.match(/\d{4}/);
            if (match) {
                const year = match[0];
                gid162Counts[year] = (gid162Counts[year] || 0) + 1;
            }
        }
    });
    console.log('GID 1626127241 Counts:', gid162Counts);

    const total = {};
    [gid0Counts, gid162Counts].forEach(counts => {
        Object.keys(counts).forEach(year => {
            total[year] = (total[year] || 0) + counts[year];
        });
    });
    console.log('\n--- TOTAL ---');
    console.log(total);
}

analyze();
