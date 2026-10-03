// Keys are the properties of __JSON_URLS, values are the filenames (without extension) in build/gen
export const JSON_FILENAMES = {
	names: "names",
	namesFemale: "names-female",
	realPlayerData: "real-player-data",
	realPlayerStats: "real-player-stats",
} as const;

type JsonKey = keyof typeof JSON_FILENAMES;

export type JsonHashes = Partial<Record<JsonKey, string>>;

export const jsonKeys = Object.keys(JSON_FILENAMES) as JsonKey[];

// This goes in the "define" of the bundler, rather than doing a search/replace on the output, so source maps stay correct. Hashes are only used in production, otherwise it's just the normal filename.
export const jsonUrlsDefine = (hashes: JsonHashes = {}) => {
	const define: Record<string, string> = {};
	for (const key of jsonKeys) {
		const hash = hashes[key];
		const suffix = hash !== undefined ? `-${hash}` : "";
		define[`__JSON_URLS.${key}`] = JSON.stringify(
			`/gen/${JSON_FILENAMES[key]}${suffix}.json`,
		);
	}
	return define;
};
