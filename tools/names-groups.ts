import { existsSync } from "node:fs";
import * as fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

// Keep in sync with defaultCountries.ts
const groups = {
	//chinese: ["China", "Taiwan"], // No gender
	hispanic: [
		"Argentina",
		"Chile",
		"Colombia",
		"Costa Rica",
		// "Cuba", // No gender
		// "El Salvador", // No gender
		// "Ecuador", // No gender
		"Guatemala",
		"Honduras",
		"Mexico",
		"Nicaragua",
		"Panama",
		// "Dominican Republic", // No gender
		"Uruguay",
		"Venezuela",
		"Spain",
		"Bolivia",
		"Paraguay",
		"Peru",
		// "Puerto Rico", // No gender
	],
	korean: [
		"South Korea",
		//"North Korea", // No data
	],

	// Not worth doing without Portugal
	/*portuguese: [
		"Angola",
		"Brazil",
		"Cape Verde",
		// "Portugal", // No gender
		// "Mozambique", // No gender
		// "East Timor", // No gender
		// "Guinea-Bissau", // No gender
		// "Macau", // No gender
	],*/
};

const browser = await chromium.launch();

const rawFolder = path.join(import.meta.dirname, "names-groups-html");

await fs.mkdir(rawFolder, { recursive: true });

const types = ["forenames", "surnames"] as const;

for (const [group, countries] of Object.entries(groups)) {
	const slugs = countries.map((country) =>
		country.toLowerCase().replaceAll(" ", "-"),
	);
	const counts: Record<(typeof types)[number], Record<string, number>> = {
		forenames: {},
		surnames: {},
	};

	for (const slug of slugs) {
		for (const type of types) {
			const filePath = path.join(rawFolder, `${type}-${slug}.html`);
			if (!existsSync(filePath)) {
				const response = await fetch(`https://forebears.io/${slug}/${type}`);
				const html = await response.text();
				await fs.writeFile(filePath, html);
				console.log("save", filePath);
			}

			const page = await browser.newPage();
			await page.goto(`file://${filePath}`);

			const rows = await page.evaluate((type) => {
				const rowsOutput = [];
				const rows = document.querySelectorAll(".forename-table tbody tr");
				for (const row of rows) {
					if (row.children.length > 1) {
						let name;
						let frequency;
						if (type === "forenames") {
							name = row.children[2]!.textContent;
							frequency = Number.parseInt(
								row.children[3]!.textContent.replaceAll(",", ""),
							);
							const malePct = Number.parseInt(
								row.children[1]!.querySelector(".m")?.textContent ?? "0",
							);

							if (Number.isNaN(malePct) || malePct < 75) {
								continue;
							}
						} else {
							name = row.children[1]!.textContent;
							frequency = Number.parseInt(
								row.children[2]!.textContent.replaceAll(",", ""),
							);
						}

						rowsOutput.push({ name, frequency });
					}
				}

				if (rowsOutput.every((row) => row.frequency === 1)) {
					// These have no gender
					return;
				}

				return rowsOutput;
			}, type);
			if (rows === undefined) {
				console.log(`No gender: ${slug}`);
				continue;
			}
			if (rows.some((row) => row.name === "Maria")) {
				console.log(
					"Maria",
					slug,
					rows.find((row) => row.name === "Maria"),
				);
			}

			const nameOverrides: Record<string, string> =
				group === "korean" && type === "surnames"
					? {
							I: "Lee",
							O: "Oh",
							U: "Yu",
						}
					: {};

			for (const { name, frequency } of rows) {
				const actualName = nameOverrides[name] ?? name;

				const object = counts[type];
				if (object[actualName] === undefined) {
					object[actualName] = 0;
				}
				object[actualName] += frequency;
			}
		}
	}

	for (const type of types) {
		const limit = group === "hispanic" ? 500 : 100;

		const rows = Object.entries(counts[type])
			.sort((a, b) => b[1] - a[1])
			.slice(0, limit);
		const minFrequency = Math.min(...rows.map((row) => row[1]));
		const csv = `Name,Frequency\n${rows.map((row) => `${row[0]},${Math.round(row[1] / minFrequency)}\n`).join("")}`;

		const outputPath = path.join(
			import.meta.dirname,
			"names-manual",
			`group-${group}-${type === "forenames" ? "first" : "last"}.csv`,
		);
		await fs.writeFile(outputPath, csv);
	}
}

await browser.close();
