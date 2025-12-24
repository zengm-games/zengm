import { svgsIndex } from "facesjs";
import isSport from "../../../common/isSport.ts";
import { choice } from "../../../common/random.ts";

const genRandomJersey = () => {
	const jerseys = svgsIndex.jersey.filter((id) =>
		id.startsWith(isSport("basketball") ? "jersey" : process.env.SPORT),
	);
	const jersey = choice(jerseys);
	if (isSport("baseball")) {
		const hats = svgsIndex.accessories.filter((id) => id.startsWith("hat"));

		return `${jersey}:${choice(hats)}`;
	} else {
		return jersey;
	}
};

export default genRandomJersey;
