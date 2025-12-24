import { svgsIndex } from "facesjs";
import isSport from "../../../common/isSport.ts";

const isValidJersey = (jersey: unknown) => {
	if (typeof jersey !== "string") {
		return false;
	}

	// Make sure string is a valid jersey, regardless of sport
	if (isSport("baseball")) {
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
		(isSport("basketball") && jersey.startsWith("jersey")) ||
		(!isSport("basketball") && jersey.startsWith(process.env.SPORT))
	);
};

export default isValidJersey;
