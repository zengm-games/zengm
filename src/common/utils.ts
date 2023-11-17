import justOrderBy from "just-order-by";

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

const maxMinByFactory = (type: "max" | "min") => {
	const max = type === "max";

	return <T extends unknown>(
		items: T[],
		iteratee: keyof T | ((item: T) => number),
	) => {
		let bestItem = undefined;
		let bestScore = max ? -Infinity : Infinity;

		const iterateeString = typeof iteratee === "string";

		for (const item of items) {
			let score;
			if (iterateeString) {
				score = (item as any)[iteratee];
			} else {
				score = (iteratee as any)(item);
			}

			if ((max && score > bestScore) || (!max && score < bestScore)) {
				bestItem = item;
				bestScore = score;
			}
		}

		return bestItem;
	};
};

export const maxBy = maxMinByFactory("max");

export const minBy = maxMinByFactory("min");

export const omit = <T extends Record<string, unknown>, U extends keyof T>(
	object: T,
	remove: U,
) => {
	const output: any = {};
	for (const key of Object.keys(object)) {
		if (remove !== key) {
			output[key] = object[key];
		}
	}
	return output as Omit<T, U>;
};

export const countBy = <T extends unknown>(
	items: T[],
	iteratee: string | ((item: T) => number | string),
) => {
	const output: Record<string, number> = {};

	const iterateeString = typeof iteratee === "string";

	for (const item of items) {
		let key;
		if (iterateeString) {
			key = (item as any)[iteratee];
		} else {
			key = (iteratee as any)(item);
		}

		if (output[key] === undefined) {
			output[key] = 1;
		} else {
			output[key] += 1;
		}
	}

	return output;
};

export const orderBy = <
	Item extends unknown,
	Key extends keyof Item | ((item: Item) => number | string),
	AscDesc extends "asc" | "desc",
>(
	items: Item[],
	keys: Key | Key[],
	orders?: AscDesc | AscDesc[],
): Item[] => {
	const keysArray = Array.isArray(keys) ? keys : [keys];
	const ordersArray = typeof orders === "string" ? [orders] : orders;

	type OrderParams = NonNullable<Parameters<typeof justOrderBy<Item>>[1]>;
	type OrderParam = OrderParams[number];

	const params = keysArray.map((key, i) => {
		const param: OrderParam = {
			property: key,
			order: ordersArray?.[i],
		};

		return param;
	});

	return justOrderBy(items, params as OrderParams);
};

type OrderByParams = Parameters<typeof orderBy>;
export type OrderBySortParams = [OrderByParams[1], OrderByParams[2]];
