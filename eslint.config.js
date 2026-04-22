import globals from "globals";
import nkzw from "@nkzw/eslint-config";
import { defineConfig, globalIgnores } from "eslint/config";
import pluginJsxA11y from "eslint-plugin-jsx-a11y";

// We want to manually specify our own globals for different folders
let found = false;
for (const row of nkzw) {
	if (row.languageOptions?.globals) {
		delete row.languageOptions.globals;
		found = true;
	}
}
if (!found) {
	throw new Error("Did not find any globals to delete");
}

// Get any globals that are safe to use in both the browser and worker
const getCommonGlobals = (a, b) => {
	const merged = {};
	for (const [key, value] of Object.entries(a)) {
		if (b[key] !== undefined) {
			merged[key] = value;
		}
	}
	for (const [key, value] of Object.entries(b)) {
		if (a[key] !== undefined) {
			merged[key] = value;
		}
	}
	return merged;
};
const commonGlobals = getCommonGlobals(globals.browser, globals.sharedWorker);

export default defineConfig(
	globalIgnores([
		"analysis/",
		"build/",
		"public/upgrade-50/",
		"tools/playoff-seed-odds-winning.js",
	]),
	{ files: ["**/*.{js,jsx,ts,tsx}"] },
	...nkzw,
	pluginJsxA11y.flatConfigs.recommended,
	{
		rules: {
			"@nkzw/no-instanceof": "off",
			"@typescript-eslint/no-explicit-any": "off",
			// Really just want to disable in TSX files, where this pattern is actually needed https://github.com/typescript-eslint/typescript-eslint/issues/4062
			"@typescript-eslint/no-unnecessary-type-constraint": "off",
			"import-x/extensions": ["error", "ignorePackages"],
			"import-x/no-namespace": "off",
			"jsx-a11y/anchor-has-content": "off",
			"jsx-a11y/anchor-is-valid": "off",
			"jsx-a11y/click-events-have-key-events": "off",
			"jsx-a11y/label-has-associated-control": "off",
			"jsx-a11y/no-static-element-interactions": "off",
			"no-console": "off",
			"no-empty": "off",
			"no-extra-parens": "off",
			"no-self-compare": "error",
			"no-undef": "error", // TypeScript catches most of these, except worker/browser differences. Would be nice to somehow get TypeScript to place nicely here, but it doens't like my cross-folder imports, even type imports
			"perfectionist/sort-interfaces": "off",
			"perfectionist/sort-jsx-props": "off",
			"perfectionist/sort-objects": "off",
			"perfectionist/sort-object-types": "off",
			"prefer-const": [
				"error",
				{
					destructuring: "all",
				},
			],
			"react/display-name": "off",
			"react/jsx-key": "off", // Too many false positives, like on DataTableRow.data
			"react/jsx-no-target-blank": "off", // https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/noopener  Note: Setting target="_blank" on <a>, <area> and <form> elements implicitly provides the same rel behavior as setting rel="noopener" which does not set window.opener.
			"react/jsx-sort-props": "off",
			"react/no-unescaped-entities": "off",

			// Would be nice to enable these
			"react-hooks/immutability": "off",
			"react-hooks/purity": "off",
			"react-hooks/refs": "off",
			"react-hooks/set-state-in-effect": "off",

			"react-hooks/react-compiler": "off",
			"sort-destructure-keys/sort-destructure-keys": "off",
			"sort-keys-fix/sort-keys-fix": "off",
			"typescript-sort-keys/interface": "off",
			"unicorn/consistent-function-scoping": "off",
			"unicorn/numeric-separators-style": "off",
			"unicorn/prefer-string-replace-all": "off", // replaceAll fails in some cases, idk why, but shows up in error logs and someone complained
			"unicorn/prefer-ternary": "off",
			"unicorn/prefer-top-level-await": "off", // Chrome 89, Safari ?

			// Nice for catching if(0){} but too many false positives for object checks that can't be disabled
			/*"@typescript-eslint/strict-boolean-expressions": ["error", {
				"allowString": true,
				"allowNumber": false,
				"allowNullableObject": true,
				"allowNullableBoolean": true,
				"allowNullableString": true,
				"allowNullableNumber": false,
				"allowAny": true
			}],*/
		},
	},
	{
		ignores: ["public/sw.js"],
		files: ["src/ui/**/*.{js,jsx,ts,tsx}", "public/**/*.js"],
		languageOptions: {
			globals: {
				...globals.browser,
				process: false,

				// This is needed for no-undef
				AlgorithmIdentifier: false,
				BufferSource: false,
				HTMLCollectionOf: false,
				ReadableStreamController: false,
				StripeCheckoutHandler: false,
				stripe: false,
			},
		},
	},
	{
		files: ["public/sw.js"],
		languageOptions: {
			globals: {
				...globals.serviceworker,
			},
		},
	},
	{
		files: ["src/worker/**/*.{js,jsx,ts,tsx}"],

		languageOptions: {
			globals: {
				...globals.sharedWorker,
				process: false,

				// This is needed for no-undef
				IDBValidKey: false,
				IDBTransactionMode: false,
				IDBTransactionOptions: false,
			},
		},
	},
	{
		// Common files for use in browser and worker
		ignores: ["src/ui/**/*", "src/worker/**/*", "public/**/*"],
		files: ["src/**/*.{js,jsx,ts,tsx}"],

		languageOptions: {
			globals: {
				...commonGlobals,
				process: false,

				// This is needed for no-undef
				HTMLLinkElement: false,
			},
		},
	},
	{
		files: ["*.{js,ts}", "tools/**/*.{js,ts}"],

		languageOptions: {
			globals: {
				...globals.node,

				// This is needed for no-undef
				NodeJS: false,
			},
		},

		rules: {
			"@typescript-eslint/no-var-requires": "off",
		},
	},
);
