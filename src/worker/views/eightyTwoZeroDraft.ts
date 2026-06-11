import { bySport } from "../../common/sportFunctions.ts";
import { helpers, local } from "../util/index.ts";
import {
	checkCanUse,
	DEFAULT_EIGHTY_TWO_ZERO_DRAFT,
} from "../api/eightyTwoZeroDraft.ts";

const updateEightyTwoZeroDraft = async () => {
	try {
		checkCanUse();
	} catch (error) {
		// https://stackoverflow.com/a/59923262/786644
		const returnValue = {
			errorMessage: error.message,
		};
		return returnValue;
	}

	const draft = local.eightyTwoZeroDraft;
	const stats = bySport({
		baseball: ["gp", "keyStats", "war"],
		basketball: ["gp", "min", "pts", "trb", "ast", "per", "ws"],
		football: ["gp", "keyStats", "av"],
		hockey: ["gp", "keyStats", "ops", "dps", "ps"],
	});

	return {
		initialDraftState: {
			loading: false,
			started: draft !== undefined,
			...(draft ?? helpers.deepCopy(DEFAULT_EIGHTY_TWO_ZERO_DRAFT)),
		},
		stats,
	};
};

export default updateEightyTwoZeroDraft;
