// Test parser to debug parsing issues
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIXTURE_PATH = path.join(
	__dirname,
	"../src/__tests__/fixtures/1759320900.dat",
);

// Simplified parser to test individual lines
function parsePost(postStr, resNum) {
	const trimmedPostStr = postStr.trim();
	if (!trimmedPostStr) return null;

	try {
		const splitParts = trimmedPostStr.split("<>");
		const dateAndIdIdx = splitParts.findIndex((str) => str.includes("ID:"));

		if (dateAndIdIdx < 2 || dateAndIdIdx + 1 >= splitParts.length) {
			console.log(
				`Line ${resNum}: Invalid structure - dateAndIdIdx=${dateAndIdIdx}, parts=${splitParts.length}`,
			);
			return null;
		}

		const authorName = (splitParts[0]?.trim() || "").replace(/<.*?>/g, "");
		const mail = splitParts[1]?.trim() || "";
		const rawContent = splitParts[dateAndIdIdx + 1]?.trim() || "";
		const content = rawContent
			.replace(/<a\s+href=[^>]*?be\.2ch\.net[^>]*?>.*?<\/a>/i, "")
			.trim();

		const headerPart = splitParts[dateAndIdIdx];
		const headerSplit = headerPart.split("ID:");
		const rawDateStr = headerSplit[0]?.trim();
		const authorId =
			headerSplit.length > 1 ? headerSplit.slice(1).join("ID:").trim() : "";

		console.log(
			`Line ${resNum}: OK - author="${authorName}", date="${rawDateStr}", id="${authorId}", content="${content.substring(0, 50)}..."`,
		);

		return {
			resNum,
			authorName,
			mail,
			rawDateStr,
			content,
			authorId,
		};
	} catch (error) {
		console.log(`Line ${resNum}: ERROR - ${error.message}`);
		console.log(`  Content: ${postStr.substring(0, 100)}...`);
		return null;
	}
}

try {
	// Read and decode the fixture file
	const buffer = fs.readFileSync(FIXTURE_PATH);
	const decoder = new TextDecoder("shift-jis");
	const content = decoder.decode(buffer);

	const lines = content.trim().split("\n");
	console.log(`=== PARSING TEST (${lines.length} lines) ===\n`);

	let successCount = 0;
	let errorCount = 0;

	// Test parsing first 50 lines
	const testLines = lines.slice(0, 50);

	testLines.forEach((line, index) => {
		const result = parsePost(line, index + 1);
		if (result) {
			successCount++;
		} else {
			errorCount++;
		}
	});

	console.log(`\n=== SUMMARY ===`);
	console.log(`Total tested: ${testLines.length}`);
	console.log(`Successful: ${successCount}`);
	console.log(`Errors: ${errorCount}`);
	console.log(
		`Success rate: ${((successCount / testLines.length) * 100).toFixed(1)}%`,
	);
} catch (error) {
	console.error("Error in test parser:", error);
}
