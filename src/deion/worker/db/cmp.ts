const getType = (x: any) => {
	if (typeof x === "number") {
		return "Number";
	}

	if (Array.isArray(x)) {
		return "Array";
	}

	if (typeof x === "string") {
		return "String";
	}

	if (typeof x === "boolean") {
		return "Boolean";
	}

	console.log(x);
	throw new Error("Invalid type - should be number, string, boolean, or array");
};

// Like indexedDB.cmp, but also support booleans (and is more restrictive in other ways, like not supporting date/binary types)
const cmp = (first: any, second: any): -1 | 0 | 1 => {
	if (second === undefined) {
		throw new TypeError();
	}

	const t1 = getType(first);
	const t2 = getType(second);

	if (t1 !== t2) {
		if (t1 === "Array") {
			return 1;
		}

		if (t1 === "String" && (t2 === "Boolean" || t2 === "Number")) {
			return 1;
		}

		if (t1 === "Number" && t2 === "Boolean") {
			return 1;
		}

		return -1;
	}

	if (t1 === "Boolean") {
		if (first === second) {
			return 0;
		}

		if (first === true) {
			return 1;
		}

		return -1;
	}

	if (t1 === "Array") {
		const length = Math.min(first.length, second.length);

		for (let i = 0; i < length; i++) {
			const result = cmp(first[i], second[i]);

			if (result !== 0) {
				return result;
			}
		}

		if (first.length > second.length) {
			return 1;
		}

		if (first.length < second.length) {
			return -1;
		}

		return 0;
	}

	if (first === second) {
		return 0;
	}

	return first > second ? 1 : -1;
};

export default cmp;
