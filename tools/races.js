require("ts-node").register();
const tsConfig = require("../tsconfig.json");
const tsConfigPaths = require("tsconfig-paths");
tsConfigPaths.register({
	baseUrl: ".",
	paths: tsConfig.compilerOptions.paths,
});

const { defaultCountries } = require("../src/worker/data/defaultCountries.ts");

const countries = Object.keys(defaultCountries).sort();
for (const country of countries) {
	console.log(country);
}
