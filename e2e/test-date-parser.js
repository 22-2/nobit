// Test date parsing specifically
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIXTURE_PATH = path.join(
	__dirname,
	"../src/__tests__/fixtures/1759320900.dat",
);

// Date parsing functions from DefaultParser
function normalizeDateStr(dateStr) {
	return dateStr
		.replace(/\(/g, " ")
		.replace(/\)/g, " ")
		.replace(/[月火水木金土日]/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

function parseDate(rawDateStr) {
	if (!rawDateStr) {
		return new Date();
	}

	const dateStr = normalizeDateStr(rawDateStr);
	console.log(`  Raw: "${rawDateStr}" -> Normalized: "${dateStr}"`);

	// Try different date formats
	const formats = [
		"yyyy/MM/dd HH:mm:ss.SSS", // talkfm
		"yyyy/MM/dd HH:mm:ss.SS", // fivechfm
		"yyyy/MM/dd HH:mm:ss", // oldfm
	];

	for (const format of formats) {
		try {
			// Simple date parsing simulation
			const parts = dateStr.split(" ");
			if (parts.length >= 2) {
				const datePart = parts[0]; // "2025/10/01"
				const timePart = parts[1]; // "21:15:00.544"

				if (datePart && timePart) {
					const [year, month, day] = datePart.split("/").map(Number);
					const timeComponents = timePart.split(":");
					const hour = parseInt(timeComponents[0]);
					const minute = parseInt(timeComponents[1]);
					const secondParts = timeComponents[2].split(".");
					const second = parseInt(secondParts[0]);
					const millisecond = secondParts[1]
						? parseInt(
								secondParts[1].padEnd(3, "0").substring(0, 3),
							)
						: 0;

					const date = new Date(
						year,
						month - 1,
						day,
						hour,
						minute,
						second,
						millisecond,
					);
					console.log(
						`  Success with format ${format}: ${date.toISOString()}`,
					);
					return date;
				}
			}
		} catch (error) {
			console.log(`  Failed with format ${format}: ${error.message}`);
		}
	}

	throw new Error(`Failed to parse date: "${rawDateStr}" -> "${dateStr}"`);
}

try {
	// Read and decode the fixture file
	const buffer = fs.readFileSync(FIXTURE_PATH);
	const decoder = new TextDecoder("shift-jis");
	const content = decoder.decode(buffer);

	const lines = content.trim().split("\n");
	console.log(`=== DATE PARSING TEST (first 10 lines) ===\n`);

	let successCount = 0;
	let errorCount = 0;

	// Test date parsing for first 10 lines
	const testLines = lines.slice(0, 10);

	testLines.forEach((line, index) => {
		const trimmed = line.trim();
		if (trimmed) {
			console.log(`Line ${index + 1}:`);

			const splitParts = trimmed.split("<>");
			const dateAndIdIdx = splitParts.findIndex((str) =>
				str.includes("ID:"),
			);

			if (dateAndIdIdx >= 2) {
				const headerPart = splitParts[dateAndIdIdx];
				const headerSplit = headerPart.split("ID:");
				const rawDateStr = headerSplit[0]?.trim();

				try {
					const date = parseDate(rawDateStr);
					console.log(`  ✓ SUCCESS\n`);
					successCount++;
				} catch (error) {
					console.log(`  ✗ ERROR: ${error.message}\n`);
					errorCount++;
				}
			} else {
				console.log(`  ✗ SKIP: Invalid structure\n`);
				errorCount++;
			}
		}
	});

	console.log(`=== SUMMARY ===`);
	console.log(`Total tested: ${testLines.length}`);
	console.log(`Successful: ${successCount}`);
	console.log(`Errors: ${errorCount}`);
	console.log(
		`Success rate: ${((successCount / testLines.length) * 100).toFixed(1)}%`,
	);
} catch (error) {
	console.error("Error in date parsing test:", error);
}
