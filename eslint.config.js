import globals from "globals";
import tseslint from "typescript-eslint";
import nkzw from "@nkzw/eslint-config";
import pluginJsxA11y from "eslint-plugin-jsx-a11y";

export default tseslint.config(
	{
		ignores: [
			"analysis/",
			"build/",
			"public/upgrade-50/",
			"tools/playoff-seed-odds-winning.js",
		],
	},
	{ files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
	{
		languageOptions: {
			globals: {
				...globals.browser,
				process: false,
			},
		},
	},
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
		files: ["**/*.js", "tools/**/*.{cjs,js,ts}"],

		languageOptions: {
			globals: {
				...globals.node,
			},
		},

		rules: {
			"@typescript-eslint/no-var-requires": "off",
		},
	},
	{
		files: ["src/test/*.{js,ts}"],

		languageOptions: {
			globals: {
				...globals.jest,
			},
		},
	},
);
