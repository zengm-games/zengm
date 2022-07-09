const bySport = <T extends unknown>(
	object:
		| {
				baseball: T;
				basketball: T;
				football: T;
				hockey: T;
				default?: T;
		  }
		| {
				baseball?: T;
				basketball?: T;
				football?: T;
				hockey?: T;
				default: T;
		  },
): T => {
	const sport = process.env.SPORT;
	if (Object.hasOwn(object, sport)) {
		// https://github.com/microsoft/TypeScript/issues/21732
		// @ts-expect-error
		return object[sport];
	}

	if (Object.hasOwn(object, "default")) {
		// https://github.com/microsoft/TypeScript/issues/21732
		// @ts-expect-error
		return object.default;
	}

	throw new Error("No value for sport and no default");
};

export default bySport;
