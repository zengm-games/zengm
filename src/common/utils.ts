// Why not use lodash? groupByUnique doesn't exist there, and these are smaller

import type { NonEmptyArray } from "./types.ts";

// iteratee can be a function taking item and returning number/string, or a number/string of a property of item
const getValueByIteratee = <T, K extends keyof T, R>(
	iteratee: ((item: T) => R) | K,
	item: T,
) => {
	if (typeof iteratee === "function") {
		return iteratee(item);
	}

	return item[iteratee] as string | number;
};

// Similar to lodash's keyBy, except it errors on duplicate keys.
// Could also add a version that returns a Map, if necessary.
export const groupByUnique = <T extends Record<string, unknown>>(
	rows: T[],
	key: string | ((row: T) => string | number),
) => {
	const grouped: Record<string, T> = {};

	for (const row of rows) {
		const keyValue = getValueByIteratee(key, row);
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

	const backwards = start > stop;
	if (backwards) {
		for (let current = start; current > stop; current--) {
			output.push(current);
		}
	} else {
		for (let current = start; current < stop; current++) {
			output.push(current);
		}
	}

	return output;
};

const maxMinByFactory = (type: "max" | "min") => {
	const max = type === "max";

	return <T>(items: Iterable<T>, iteratee: keyof T | ((item: T) => number)) => {
		let bestItem = undefined;
		let bestScore = max ? -Infinity : Infinity;

		for (const item of items) {
			const score = getValueByIteratee(iteratee, item) as number;

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

export const omit = <T extends Record<string, unknown>, U extends (keyof T)[]>(
	object: T,
	remove: U,
) => {
	const output: any = {};
	for (const key of Object.keys(object)) {
		if (!remove.includes(key)) {
			output[key] = object[key];
		}
	}
	return output as Omit<T, U[number]>;
};

export const countBy = <T>(
	items: Iterable<T>,
	iteratee: keyof T | ((item: T) => number | string),
) => {
	const output: Record<string, number> = {};

	for (const item of items) {
		const key = getValueByIteratee(iteratee, item);
		output[key] ??= 0;
		output[key] += 1;
	}

	return output;
};

// Rather than just `keyof Item` it should only be a key whose property is a number or string
type OrderByKey<Item> = keyof Item | ((item: Item) => number | string);
type AscDesc = "asc" | "desc";

const createSortFunction = <Item, Key extends OrderByKey<Item>>(
	keys: Key | Key[],
	orders?: AscDesc | AscDesc[],
) => {
	const keysArray = Array.isArray(keys) ? keys : [keys];
	const ordersArray = typeof orders === "string" ? [orders] : orders;

	return (a: Item, b: Item) => {
		for (const [i, key] of keysArray.entries()) {
			const order = ordersArray?.[i];

			const valueA = getValueByIteratee(key, a) ?? Infinity;
			const valueB = getValueByIteratee(key, b) ?? Infinity;

			const descending = order === "desc";

			const typeA = typeof valueA;
			const typeB = typeof valueB;
			if (typeA === "number" && typeB === "string") {
				return descending ? -1 : 1;
			}
			if (typeA === "string" && typeB === "number") {
				return descending ? 1 : -1;
			}

			if (valueA < valueB) {
				return descending ? 1 : -1;
			}

			if (valueA > valueB) {
				return descending ? -1 : 1;
			}
		}
		return 0;
	};
};

export const orderBy = <Item, Key extends OrderByKey<Item>>(
	items: Iterable<Item>,
	keys: Key | Key[],
	orders?: AscDesc | AscDesc[],
): Item[] => {
	// Sometimes this happens and lodash supported it
	if (items === undefined) {
		return [];
	}

	const copied = Array.isArray(items) ? items.slice() : Array.from(items);

	return copied.sort(createSortFunction(keys, orders));
};

type OrderByParams = Parameters<typeof orderBy>;
export type OrderBySortParams = [OrderByParams[1], OrderByParams[2]];

export const chunk = <T>(array: T[], chunkSize: number): T[][] => {
	const chunks: T[][] = [];
	for (let i = 0; i < array.length; i += chunkSize) {
		chunks.push(array.slice(i, i + chunkSize));
	}
	return chunks;
};

// This is because I couldn't figure out how to make NonEmptyArray.at(-1) always return T rather than T | undefined
export const last = <T>(array: NonEmptyArray<T>) => {
	return array.at(-1)!;
};
