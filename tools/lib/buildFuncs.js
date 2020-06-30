const CleanCSS = require("clean-css");
const crypto = require("crypto");
const fs = require("fs");
const fse = require("fs-extra");
const sass = require("node-sass");
const path = require("path");
const replace = require("replace");
const getSport = require("./getSport");

const fileHash = contents => {
	// https://github.com/sindresorhus/rev-hash
	return crypto.createHash("md5").update(contents).digest("hex").slice(0, 10);
};

const buildCSS = (watch /*: boolean*/ = false) => {
	const filenames = ["light", "dark"];
	for (const filename of filenames) {
		const start = process.hrtime();

		// If more Sass files are needed, then create them and @import them into this main Sass file.
		const sassFilePath = `public/css/${filename}.scss`;
		const sassResult = sass.renderSync({
			file: sassFilePath,
		});
		const source = sassResult.css.toString();

		let outFilename;
		if (watch) {
			outFilename = `build/gen/${filename}.css`;

			replace({
				regex: `-CSS_HASH_${filename.toUpperCase()}`,
				replacement: "",
				paths: ["build/index.html"],
				silent: true,
			});
		} else {
			const hash = fileHash(source);
			outFilename = `build/gen/${filename}-${hash}.css`;

			replace({
				regex: `CSS_HASH_${filename.toUpperCase()}`,
				replacement: hash,
				paths: ["build/index.html"],
				silent: true,
			});
		}

		let output;
		if (!watch) {
			const result = new CleanCSS().minify(source);
			if (result.errors.length > 0) {
				console.log("clean-css errors", result.errors);
			}
			if (result.warnings.length > 0) {
				console.log("clean-css warnings", result.warnings);
			}
			output = result.styles;
		} else {
			output = source;
		}

		fs.writeFileSync(outFilename, output);

		if (!watch) {
			const bytes = Buffer.byteLength(output, "utf8");

			const diff = process.hrtime(start);
			const NS_PER_SECOND = 10 ** 9;
			const timeInS = diff[0] + diff[1] / NS_PER_SECOND;

			console.log(
				`${(bytes / 1024 / 1024).toFixed(
					2,
				)} MB written to ${outFilename} (${timeInS.toFixed(
					2,
				)} seconds) at ${new Date().toLocaleTimeString()}`,
			);
		}
	}
};

const setSport = () => {
	if (process.env.SPORT === "football") {
		replace({
			regex: "basketball",
			replacement: "football",
			paths: ["build/index.html"],
			silent: true,
		});
		replace({
			regex: "Basketball",
			replacement: "Football",
			paths: ["build/index.html"],
			silent: true,
		});

		// lol
		replace({
			regex: "football-gm.com/prebid",
			replacement: "basketball-gm.com/prebid",
			paths: ["build/index.html"],
			silent: true,
		});
	}
};

const copyFiles = () => {
	const foldersToIgnore = ["basketball", "css", "football"];

	fse.copySync("public", "build", {
		filter: filename => {
			// Loop through folders to ignore.
			for (const folder of foldersToIgnore) {
				if (filename.startsWith(path.join("public", folder))) {
					return false;
				}
			}

			return true;
		},
	});

	let sport = process.env.SPORT;
	if (typeof sport !== "string") {
		sport = "basketball";
	}

	fse.copySync(path.join("public", sport), "build", {
		filter: filename => !filename.includes(".gitignore"),
	});

	// Remove the empty folders created by the "filter" function.
	for (const folder of foldersToIgnore) {
		fse.removeSync(`build/${folder}`);
	}

	const realPlayerDataFilename = path.join(
		"data",
		`real-player-data-${sport}.json`,
	);
	if (fs.existsSync(realPlayerDataFilename)) {
		fse.copySync(realPlayerDataFilename, "build/gen/real-player-data.json");
	}

	setSport();
};

const genRev = () => {
	const d = new Date();
	const date = d.toISOString().split("T")[0].replace(/-/g, ".");
	const minutes = String(d.getUTCMinutes() + 60 * d.getUTCHours()).padStart(
		4,
		"0",
	);
	const rev = `${date}.${minutes}`;

	return rev;
};

const reset = () => {
	fse.removeSync("build");
	fs.mkdirSync("build/gen", { recursive: true });
};

const setTimestamps = (rev /*: string*/, watch /*: boolean*/ = false) => {
	const sport = getSport();

	replace({
		regex: "REV_GOES_HERE",
		replacement: rev,
		paths: watch
			? ["build/index.html"]
			: [
					"build/index.html",
					`build/gen/ui-${rev}.js`,
					`build/gen/ui-legacy-${rev}.js`,
					`build/gen/worker-${rev}.js`,
					`build/gen/worker-legacy-${rev}.js`,
			  ],
		silent: true,
	});

	if (!watch) {
		replace({
			regex: "/gen/worker-",
			replacement: "/gen/worker-legacy-",
			paths: [`build/gen/ui-legacy-${rev}.js`],
			silent: true,
		});
	}

	replace({
		regex: "GOOGLE_ANALYTICS_ID",
		replacement: sport === "basketball" ? "UA-38759330-1" : "UA-38759330-2",
		paths: ["build/index.html"],
		silent: true,
	});

	replace({
		regex: "BBGM_ADS_FILENAME",
		replacement: sport === "basketball" ? "bbgm" : "fbgm",
		paths: ["build/index.html"],
		silent: true,
	});

	replace({
		regex: "BUGSNAG_API_KEY",
		replacement:
			sport === "basketball"
				? "c10b95290070cb8888a7a79cc5408555"
				: "fed8957cbfca2d1c80997897b840e6cf",
		paths: ["build/index.html"],
		silent: true,
	});

	let quantcastCode = "";
	if (!watch && sport === "basketball") {
		quantcastCode = `<script type="text/javascript">
if (window.enableLogging) {
var _qevents = _qevents || [];(function() {
var elem = document.createElement('script');
elem.src = (document.location.protocol == "https:" ? "https://secure" : "http://edge") + ".quantserve.com/quant.js";
elem.async = true;
elem.type = "text/javascript";
var scpt = document.getElementsByTagName('script')[0];
scpt.parentNode.insertBefore(elem, scpt);
})();_qevents.push({
qacct:"p-Ye5RY6xC03ZWz"
});
}
</script><noscript>
<div style="display:none;">
<img src="//pixel.quantserve.com/pixel/p-Ye5RY6xC03ZWz.gif" border="0" height="1" width="1" alt="Quantcast"/>
</div>
</noscript>`;
	}

	replace({
		regex: "QUANTCAST_CODE",
		replacement: quantcastCode,
		paths: ["build/index.html"],
		silent: true,
	});

	if (watch) {
		replace({
			regex: '-" \\+ bbgmVersion \\+ "',
			replacement: "",
			paths: ["build/index.html"],
			silent: true,
		});
	}

	return rev;
};

module.exports = {
	buildCSS,
	copyFiles,
	fileHash,
	genRev,
	reset,
	setTimestamps,
};
