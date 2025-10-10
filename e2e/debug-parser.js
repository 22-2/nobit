// Debug script to analyze the fixture file format
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIXTURE_PATH = path.join(
	__dirname,
	"../src/__tests__/fixtures/1759320900.dat",
);

try {
	// Read as binary buffer
	const buffer = fs.readFileSync(FIXTURE_PATH);

	// Decode using TextDecoder (same as DefaultDecoder)
	const decoder = new TextDecoder("shift-jis");
	const content = decoder.decode(buffer);

	console.log("=== FIXTURE FILE ANALYSIS ===");
	console.log(`Total content length: ${content.length}`);

	const lines = content.split("\n");
	console.log(`Total lines: ${lines.length}`);

	// Analyze first few lines
	console.log("\n=== FIRST 5 LINES ANALYSIS ===");
	for (let i = 0; i < Math.min(5, lines.length); i++) {
		const line = lines[i].trim();
		if (line) {
			console.log(`\nLine ${i + 1}:`);
			console.log(`Raw: ${line}`);

			const parts = line.split("<>");
			console.log(`Parts count: ${parts.length}`);
			parts.forEach((part, idx) => {
				console.log(`  Part ${idx}: "${part}"`);
			});

			// Check for ID pattern
			const idPart = parts.find((part) => part.includes("ID:"));
			if (idPart) {
				console.log(`  ID part found at: ${parts.indexOf(idPart)}`);
				console.log(`  ID part content: "${idPart}"`);
			}
		}
	}

	// Check for empty lines
	const emptyLines = lines.filter((line) => !line.trim()).length;
	console.log(`\nEmpty lines: ${emptyLines}`);

	// Check for lines that might cause parsing issues
	const problematicLines = [];
	lines.forEach((line, idx) => {
		const trimmed = line.trim();
		if (trimmed) {
			const parts = trimmed.split("<>");
			const idIdx = parts.findIndex((part) => part.includes("ID:"));

			if (idIdx < 2 || idIdx + 1 >= parts.length) {
				problematicLines.push({
					lineNumber: idx + 1,
					line: trimmed.substring(0, 100) + "...",
					partsCount: parts.length,
					idIndex: idIdx,
				});
			}
		}
	});

	console.log(`\n=== PROBLEMATIC LINES (${problematicLines.length}) ===`);
	problematicLines.slice(0, 10).forEach((item) => {
		console.log(
			`Line ${item.lineNumber}: parts=${item.partsCount}, idIdx=${item.idIndex}`,
		);
		console.log(`  Content: ${item.line}`);
	});
} catch (error) {
	console.error("Error analyzing fixture:", error);
}
