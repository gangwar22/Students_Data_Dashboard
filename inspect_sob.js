import Papa from "papaparse";

const SOB_URL = "https://docs.google.com/spreadsheets/d/1k2pJyCAW3hjNw3ElhG4Rj3rFIEKeswXflTq5lKjmDe4/export?format=csv&gid=30053432";

async function analyzeSOB() {
    process.stdout.write("Fetching SOB data...");
    try {
        const response = await fetch(SOB_URL);
        const csvText = await response.text();
        const results = Papa.parse(csvText, { header: false, skipEmptyLines: true });
        
        console.log("\nTotal raw rows in SOB sheet: " + results.data.length);
        
        // Let us look at first 5 rows to see what is going on
        results.data.slice(0, 5).forEach((row, i) => {
            console.log("Row " + i + ": " + JSON.stringify(row));
        });

    } catch (e) {
        console.error(e);
    }
}
analyzeSOB();
