import { svgsIndex } from "facesjs";
import { choice } from "../../../common/random.ts";

const genRandomJersey = () => {
	const jerseys = svgsIndex.jersey.filter((id) =>
		id.startsWith(__SPORT === "basketball" ? "jersey" : __SPORT),
	);
	const jersey = choice(jerseys);
	if (__SPORT === "baseball") {
		const hats = svgsIndex.accessories.filter((id) => id.startsWith("hat"));

		return `${jersey}:${choice(hats)}`;
	} else {
		return jersey;
	}
};

export default genRandomJersey;
