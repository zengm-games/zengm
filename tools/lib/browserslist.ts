import path from "node:path";
import browserslist from "browserslist";

// Every supported version of every browser, like ["chrome 85", "chrome 86", ...]
export const getBrowserslist = () => {
	return browserslist(undefined, {
		config: path.join(import.meta.dirname, "../../.browserslistrc"),
	});
};

// Convert browserslist to the format used by rolldown's transform.target, like ["chrome85", "firefox115", "safari15.4"]
export const getRolldownTarget = () => {
	const minVersions = new Map<string, { number: number; string: string }>();
	for (const entry of getBrowserslist()) {
		const [name, versions] = entry.split(" ");
		if (name === undefined || versions === undefined) {
			throw new Error(`Unexpected browserslist entry "${entry}"`);
		}

		// Could be a range, like "15.2-15.3"
		const string = versions.split("-")[0]!;
		const number = Number.parseFloat(string);
		if (Number.isNaN(number)) {
			throw new Error(`Unexpected browserslist entry "${entry}"`);
		}

		const current = minVersions.get(name);
		if (!current || number < current.number) {
			minVersions.set(name, { number, string });
		}
	}

	return Array.from(minVersions, ([name, { string }]) => `${name}${string}`);
};
