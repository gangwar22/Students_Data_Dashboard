const fs = require('fs');

function extractPlacementYear(value) {
  const text = String(value || '').trim();
  if (!text) return '';

  const cleanedText = text.replace(/^[-]+/, '');

  const fullYearMatch = cleanedText.match(/\b(202[2-7])\b/);
  if (fullYearMatch) return fullYearMatch[1];

  const dateMatch = cleanedText.match(/\b\d{1,2}[/-]\d{1,2}[/-](\d{4})\b/);
  if (dateMatch) {
    const year = dateMatch[1];
    if (['2022', '2023', '2024', '2025', '2026', '2027'].includes(year)) return year;
  }

  const mmmMatch = cleanedText.match(/\b\d{1,2}[-\s/](jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[-\s/](\d{4})\b/i);
  if (mmmMatch) {
    const year = mmmMatch[2];
    if (['2022', '2023', '2024', '2025', '2026', '2027'].includes(year)) return year;
  }

  const typoYearMatch = cleanedText.match(/\b2020?([2-7])\b/);
  if (typoYearMatch) return `202${typoYearMatch[1]}`;

  const shortYearMatch = cleanedText.match(/\b(22|23|24|25|26|27)\b/);
  if (shortYearMatch) return `20${shortYearMatch[1]}`;

  const digitsOnly = cleanedText.replace(/\D/g, '');
  if (digitsOnly.includes('2022') || digitsOnly.includes('20202')) return '2022';
  if (digitsOnly.includes('2023') || digitsOnly.includes('20203')) return '2023';
  if (digitsOnly.includes('2024') || digitsOnly.includes('20204')) return '2024';
  if (digitsOnly.includes('2025') || digitsOnly.includes('20205')) return '2025';
  if (digitsOnly.includes('2026') || digitsOnly.includes('20206')) return '2026';
  if (digitsOnly.includes('2027') || digitsOnly.includes('20207')) return '2027';

  const parsed = new Date(cleanedText);
  if (!Number.isNaN(parsed.getTime())) {
    const parsedYear = String(parsed.getFullYear());
    if (['2022', '2023', '2024', '2025', '2026', '2027'].includes(parsedYear)) return parsedYear;
  }

  return '';
}

function pickFirstValue (row, keys) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
};

function inferPlacementBatch(row) {
  const jobYearValue = row['Job Year'] || row['Job Year '] || row['Job Year  '];
  const fromJobYear = extractPlacementYear(jobYearValue);
  if (fromJobYear) return fromJobYear;

  const placementDateCandidate = row['Date of leaving - Placed'] || row['Date of leaving- Placed'] || row['Date of leaving  - Placed'];
  const fromPlacedDate = extractPlacementYear(placementDateCandidate);
  if (fromPlacedDate) return fromPlacedDate;

  const fromAlternativeDate = extractPlacementYear(pickFirstValue(row, ['Date of leaving', 'Left Date', 'Placement Date', 'Placement Year', 'Date of Leaving']));
  if (fromAlternativeDate) return fromAlternativeDate;

  const fromJoiningDate = extractPlacementYear(pickFirstValue(row, ['Date of joining Campus', 'Date of joining']));
  if (fromJoiningDate) return fromJoiningDate;

  const email = (row['Email id'] || row['Mail ID'] || row['Email'] || '').toString().toLowerCase();
  const emailMatch = email.match(/(23|24|25|26)@/);
  if (emailMatch) return `20${emailMatch[1]}`;

  return '';
}

function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let headerLineIndex = 0;
    while (headerLineIndex < lines.length && 
           lines[headerLineIndex].split(',').filter(x => x.trim().length > 0).length < 5) {
        headerLineIndex++;
    }
    
    const headerLine = lines[headerLineIndex] || "";
    const dataLines = lines.slice(headerLineIndex + 1);
    
    const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    return dataLines.map(line => {
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
            if (h && i < values.length) {
                obj[h] = values[i];
            }
        });
        return obj;
    });
}

function analyze() {
    console.log('--- Analyzing GID 0 ---');
    const gid0 = parseCSV('gid_0.csv');
    const gid0Counts = {};
    gid0.forEach(row => {
        const batch = inferPlacementBatch(row);
        if (batch) gid0Counts[batch] = (gid0Counts[batch] || 0) + 1;
    });
    console.log('GID 0 Counts:', gid0Counts);

    console.log('\n--- Analyzing GID 1626127241 ---');
    const gid162 = parseCSV('gid_1626127241.csv');
    const gid162Counts = {};
    gid162.forEach(row => {
        const batch = inferPlacementBatch(row);
        if (batch) gid162Counts[batch] = (gid162Counts[batch] || 0) + 1;
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

analyze();const fs = require('fs');
const csv = require('fs').readFileSync;

function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let headerLineIndex = 0;
    while (headerLineIndex < lines.length && 
           lines[headerLineIndex].split(',').filter(x => x.trim().length > 0).length < 5) {
        headerLineIndex++;
    }
    
    const headerLine = lines[headerLineIndex];
    const dataLines = lines.slice(headerLineIndex + 1);
    
    const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    return dataLines.map(line => {
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
            if (h && i < values.length) {
                obj[h] = values[i];
            }
        });
        return obj;
    });
}

function analyze() {
    console.log('--- Analyzing GID 0 ---');
    const gid0 = parseCSV('gid_0.csv');
    const gid0Counts = {};
    const missingInGid0 = [];
    gid0.forEach(row => {
        const year = row['Job Year'];
        if (year && year.trim()) {
            gid0Counts[year] = (gid0Counts[year] || 0) + 1;
        } else if (row['Student']) {
            missingInGid0.push(row['Student']);
            // Try fallback
            const dateStr = row['Date of leaving - Placed'];
            if (dateStr) {
                const match = dateStr.match(/\d{4}/);
                if (match) {
                    const yearFallback = match[0];
                    gid0Counts[yearFallback] = (gid0Counts[yearFallback] || 0) + 1;
                }
            }
        }
    });
    console.log('GID 0 Counts (including inferred):', gid0Counts);
    console.log('GID 0 Missing "Job Year":', missingInGid0.length);

    console.log('\n--- Analyzing GID 1626127241 ---');
    const gid162 = parseCSV('gid_1626127241.csv');
    const gid162Counts = {};
    const rawDates = [];
    
    gid162.forEach(row => {
        const dateStr = row['Date of leaving - Placed'];
        if (dateStr) {
            rawDates.push(dateStr);
            // Higher precision extraction: look for 2 or 4 digits for year
            // "08-Nov-2024" or "5/27/2024" or "23 -Dec - 2025"
            // Use regex to get the last part that matches numbers
            const dateParts = dateStr.split(/[-/]/);
            let year = null;
            if (dateParts.length > 0) {
                const lastPart = dateParts[dateParts.length - 1].trim();
                if (lastPart.length === 4) {
                    year = lastPart;
                } else if (lastPart.length === 2 && !isNaN(lastPart)) {
                    year = "20" + lastPart;
                }
            }
            if (!year) {
                const match = dateStr.match(/\d{4}/);
                if (match) year = match[0];
            }
            if (year) {
                gid162Counts[year] = (gid162Counts[year] || 0) + 1;
            }
        }
    });
    console.log('GID 1626127241 Counts:', gid162Counts);
    console.log('Total students in GID 162 sample:', gid162.length);

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
