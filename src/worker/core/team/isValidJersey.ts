import { svgsIndex } from "facesjs";

const isValidJersey = (jersey: unknown) => {
	if (typeof jersey !== "string") {
		return false;
	}

	// Make sure string is a valid jersey, regardless of sport
	if (__SPORT === "baseball") {
		const [jerseyId, accessoryId] = jersey.split(":");
		if (jerseyId === undefined || accessoryId === undefined) {
			return false;
		}

		if (
			!svgsIndex.jersey.includes(jerseyId as any) ||
			!svgsIndex.accessories.includes(accessoryId as any)
		) {
			return false;
		}
	} else {
		if (!svgsIndex.jersey.includes(jersey as any)) {
			return false;
		}
	}

	// Make sure sport matches
	return (
		(__SPORT === "basketball" && jersey.startsWith("jersey")) ||
		(__SPORT !== "basketball" && jersey.startsWith(__SPORT))
	);
};

export default isValidJersey;
