import globals from "globals";
import pluginJs from "@eslint/js";
// eslint-disable-next-line import/no-unresolved
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginImport from "eslint-plugin-import";
import pluginJsxA11y from "eslint-plugin-jsx-a11y";
import pluginReactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
	{
		ignores: ["analysis/", "build/", "public/upgrade-50/"],
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
	{
		settings: {
			"import/resolver": {
				node: {
					extensions: [".cjs", ".mjs", ".js", ".json", ".ts", ".tsx"],
				},
			},
			"import/extensions": [".cjs", ".js", ".mjs", ".jsx", ".ts", ".tsx"],
			react: {
				version: "detect",
			},
		},
	},
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
	pluginReact.configs.flat.recommended,
	pluginImport.flatConfigs.recommended,
	pluginJsxA11y.flatConfigs.recommended,
	{
		plugins: {
			"react-hooks": pluginReactHooks,
		},
		rules: {
			...pluginReactHooks.configs.recommended.rules,

			"@typescript-eslint/ban-ts-comment": "off",
			"@typescript-eslint/explicit-module-boundary-types": "off",
			"@typescript-eslint/no-empty-function": "off",
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-inferrable-types": "off",
			"@typescript-eslint/no-non-null-assertion": "off",

			// Enable this again when I have totally gotten rid of CJS scripts/configs
			"@typescript-eslint/no-require-imports": "off",

			// Really just want to disable in TSX files, where this pattern is actually needed https://github.com/typescript-eslint/typescript-eslint/issues/4062
			"@typescript-eslint/no-unnecessary-type-constraint": "off",

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
			"jsx-a11y/anchor-has-content": "off",
			"jsx-a11y/anchor-is-valid": "off",
			"jsx-a11y/click-events-have-key-events": "off",
			"jsx-a11y/label-has-associated-control": "off",
			"jsx-a11y/no-onchange": "off",
			"jsx-a11y/no-static-element-interactions": "off",

			"eslint-comments/no-unused-disable": "off",
			"no-constant-condition": ["error", { checkLoops: false }],
			"no-empty": "off",
			"no-self-compare": "error",
			"prefer-const": [
				"error",
				{
					destructuring: "all",
				},
			],
			radix: ["error", "as-needed"],

			"react/display-name": "off",
			"react/jsx-key": "off",
			"react/no-unescaped-entities": "off",
			"react/prop-types": "off",

			"react-hooks/exhaustive-deps": "warn",
			"react-hooks/rules-of-hooks": "error",
			"react/jsx-uses-react": "off",
			"react/react-in-jsx-scope": "off",
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
				...globals.mocha,
			},
		},
	},
);
