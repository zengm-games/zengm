import { toUI } from "../../util";
import type {
	GameAttributesLeagueWithHistory,
	GameAttributesLeague,
	LocalStateUI,
} from "../../../common/types";
import { unwrapGameAttribute } from "../../../common";

const gameAttributesToUI = async (
	gameAttributes: GameAttributesLeagueWithHistory,
) => {
	// Keep in sync with ui/util/local.ts
	const keys = [
		"challengeNoRatings",
		"fantasyPoints",
		"godMode",
		"hideDisabledTeams",
		"homeCourtAdvantage",
		"lid",
		"numPeriods",
		"phase",
		"quarterLength",
		"season",
		"spectator",
		"startingSeason",
		"teamInfoCache",
		"userTid",
		"userTids",
	] as const;

	const update: Partial<GameAttributesLeague> = {};
	let updated = false;
	for (const key of keys) {
		if (gameAttributes.hasOwnProperty(key)) {
			(update as any)[key] = unwrapGameAttribute(gameAttributes, key);
			updated = true;
		}
	}

	let flagOverrides: LocalStateUI["flagOverrides"] | undefined;
	if (gameAttributes.playerBioInfo) {
		flagOverrides = {};
		const countries = gameAttributes.playerBioInfo.countries;
		if (countries) {
			for (const [country, { flag }] of Object.entries(countries)) {
				if (flag !== undefined) {
					flagOverrides[country] = flag;
				}
			}
		}
	}

	if (updated) {
		await toUI("setGameAttributes", [update, flagOverrides]);
	}
};

export default gameAttributesToUI;
