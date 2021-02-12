const gameAttributesArrayToObject = (
	array: {
		key: string;
		value: any;
	}[],
) => {
	const object: Record<string, any> = {};
	for (const { key, value } of array) {
		object[key] = value;
	}

	return object;
};

export default gameAttributesArrayToObject;
