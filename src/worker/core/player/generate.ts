import genRatings from "./genRatings";
import { face, g } from "../../util";
import type {
	MinimalPlayerRatings,
	PlayerWithoutKey,
	Race,
} from "../../../common/types";
import genWeight from "./genWeight";
import genMoodTraits from "./genMoodTraits";

const generate = (
	tid: number,
	age: number,
	draftYear: number,
	newLeague: boolean,
	scoutingRank: number,
	{
		college,
		country,
		firstName,
		lastName,
		race,
	}: {
		college: string;
		country: string;
		firstName: string;
		lastName: string;
		race: Race;
	} = {
		college: "College",
		country: "Country",
		firstName: "FirstName",
		lastName: "LastName",
		race: "asian",
	},
): PlayerWithoutKey<MinimalPlayerRatings> => {
	const { heightInInches, ratings } = genRatings(
		newLeague ? g.get("startingSeason") : draftYear,
		scoutingRank,
	);

	const weight = genWeight(ratings.hgt, ratings.stre);

	const p = {
		awards: [],
		born: {
			year: g.get("season") - age,
			loc: country,
		},
		college,
		contract: {
			amount: g.get("minContract"),
			exp: g.get("season") + 1,
		},
		draft: {
			round: 0,
			pick: 0,
			tid: -1,
			originalTid: -1,
			year: draftYear,
			pot: 0,
			ovr: 0,
			skills: [],
		},
		face: face.generate(race),
		firstName,
		gamesUntilTradable: 0,
		hgt: heightInInches,
		hof: false,
		imgURL: "",
		// Custom rosters can define player image URLs to be used rather than vector faces
		injury: {
			type: "Healthy",
			gamesRemaining: 0,
		},
		injuries: [],
		lastName,
		moodTraits: genMoodTraits(),
		numDaysFreeAgent: 0,
		ptModifier: 1,
		relatives: [],
		ratings: [ratings],
		retiredYear: Infinity,
		rosterOrder: 666,
		// Will be set later
		salaries: [],
		stats: [],
		statsTids: [],
		tid,
		transactions: [],
		watch: false,
		weight,
		yearsFreeAgent: 0,
		// These should be set by updateValues after player is completely done (automatic in develop)
		value: 0,
		valueNoPot: 0,
		valueFuzz: 0,
		valueNoPotFuzz: 0,
	};

	return p;
};

export default generate;
