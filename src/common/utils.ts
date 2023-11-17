// Why not use lodash? groupByUnique doesn't exist there, and these are smaller

export const groupBy = <T extends Record<string, unknown>>(
	rows: T[],
	key: string | ((row: T) => string | number),
) => {
	const grouped: Record<string, T[]> = {};

	for (const row of rows) {
		const keyValue = (typeof key === "string" ? row[key] : key(row)) as any;
		if (Object.hasOwn(grouped, keyValue)) {
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
		if (Object.hasOwn(grouped, keyValue)) {
			throw new Error(`Duplicate primary key "${keyValue}"`);
		} else {
			grouped[keyValue] = row;
		}
	}

	return grouped;
};

export const range = (start: number, stop?: number) => {
	if (stop === undefined) {
		stop = start;
		start = 0;
	}

	const output = [];
	for (let current = start; current < stop; current++) {
		output.push(current);
	}

	return output;
};
