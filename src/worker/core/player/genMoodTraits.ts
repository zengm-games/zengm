import { MOOD_TRAITS } from "../../../common/index.ts";
import type { MoodTrait } from "../../../common/types.ts";
import { helpers, random } from "../../util/index.ts";

const MOOD_TRAIT_KEYS = helpers.keys(MOOD_TRAITS);

const genMoodTraits = () => {
	const moodTraits: MoodTrait[] = [random.choice(MOOD_TRAIT_KEYS)];
	if (Math.random() < 0.5) {
		moodTraits.push(
			random.choice(MOOD_TRAIT_KEYS.filter((trait) => trait !== moodTraits[0])),
		);
	}
	moodTraits.sort();

	return moodTraits;
};

export default genMoodTraits;
