// Why not use lodash? groupByUnique doesn't exist there.

export const groupBy = <T extends Record<string, unknown>>(
	rows: T[],
	key: string | ((row: T) => string | number),
) => {
	const grouped: Record<string, T[]> = {};

	for (const row of rows) {
		const keyValue = (typeof key === "string" ? row[key] : key(row)) as any;
		if (grouped.hasOwnProperty(keyValue)) {
			grouped[keyValue].push(row);
		} else {
			grouped[keyValue] = [row];
		}
	}

	return grouped;
};

export const groupByUnique = <T extends Record<string, unknown>>(
	rows: T[],
	key: string | ((row: T) => string | number),
) => {
	const grouped: Record<string, T> = {};

	for (const row of rows) {
		const keyValue = (typeof key === "string" ? row[key] : key(row)) as any;
		if (grouped.hasOwnProperty(keyValue)) {
			throw new Error(`Duplicate primary key "${keyValue}"`);
		} else {
			grouped[keyValue] = row;
		}
	}

	return grouped;
};
