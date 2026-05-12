import { MOOD_TRAITS } from "../../../common/constants.ts";
import { choice } from "../../../common/random.ts";
import type { MoodTrait } from "../../../common/types.ts";
import { helpers } from "../../util/index.ts";

const MOOD_TRAIT_KEYS = helpers.keys(MOOD_TRAITS);

const genMoodTraits = () => {
	const moodTraits: MoodTrait[] = [choice(MOOD_TRAIT_KEYS)];
	if (Math.random() < 0.5) {
		moodTraits.push(
			choice(MOOD_TRAIT_KEYS.filter((trait) => trait !== moodTraits[0])),
		);
	}
	moodTraits.sort();

	return moodTraits;
};

export default genMoodTraits;
