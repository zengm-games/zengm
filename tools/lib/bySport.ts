import { getSport } from "./getSport.ts";

export const bySport = <T>(
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
	const sport = getSport();
	if (Object.hasOwn(object, sport)) {
		return (object as any)[sport];
	}

	if (Object.hasOwn(object, "default")) {
		return (object as any).default;
	}

	throw new Error("No value for sport and no default");
};
