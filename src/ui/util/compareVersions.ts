// Takes BBGM version strings (like 2017.12.06.1134) and returns 1 if v1 is larger, -1 if v2 is
// larger, and 0 if they are the same.
const compareVersions = (v1: string, v2: string): -1 | 0 | 1 => {
	if (v1 === v2) {
		return 0;
	}

	const parts1 = v1.split(".");
	const parts2 = v2.split(".");

	if (parts1.length !== 4) {
		throw new Error(`Invalid version: ${v1}`);
	}

	if (parts2.length !== 4) {
		throw new Error(`Invalid version: ${v2}`);
	}

	for (let i = 0; i < 4; i++) {
		const int1 = parseInt(parts1[i], 10);
		const int2 = parseInt(parts2[i], 10);

		if (Number.isNaN(int1)) {
			throw new Error(`Invalid version: ${v1}`);
		}

		if (Number.isNaN(int2)) {
			throw new Error(`Invalid version: ${v2}`);
		}

		if (int1 > int2) {
			return 1;
		}

		if (int2 > int1) {
			return -1;
		}
	}

	return 0;
};

export default compareVersions;
