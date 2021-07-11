import getTeamInfos from "../../common/getTeamInfos";
import teamInfos from "../../common/teamInfos";
import type { Div } from "../../common/types";
import { random } from "../util";

const getRandomTeams = (divs: Div[], numTeamsPerDiv: number[]) => {
	let numTeamsTotal = 0;
	for (const num of numTeamsPerDiv) {
		numTeamsTotal += num;
	}

	const abbrevsAll = Object.keys(teamInfos);
	random.shuffle(abbrevsAll);

	const abbrevs = abbrevsAll.slice(0, numTeamsTotal);

	const teamInfosInput = [];

	let tid = 0;
	for (const div of divs) {
		const numTeams = numTeamsPerDiv[div.did];

		for (let i = 0; i < numTeams; i++) {
			teamInfosInput.push({
				tid,
				cid: div.cid,
				did: div.did,
				abbrev: abbrevs[tid],
			});

			tid += 1;
		}
	}

	return getTeamInfos(teamInfosInput);
};

export default getRandomTeams;
