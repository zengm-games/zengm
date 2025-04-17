import { PHASE, PLAYER } from "../../../common/index.ts";
import { groupByUnique } from "../../../common/utils.ts";
import type { Team } from "../../../common/types.ts";
import type { Basketball } from "./loadData.basketball.ts";
import oldAbbrevTo2020BBGMAbbrev from "./oldAbbrevTo2020BBGMAbbrev.ts";

const addRetiredJerseyNumbers = ({
	teams,
	players,
	season,
	phase,
	allBios,
	allRetiredJerseyNumbers,
}: {
	teams: {
		srID: string;
		retiredJerseyNumbers?: Team["retiredJerseyNumbers"];
	}[];
	players: {
		name: string;
		pid: number;
		tid: number;
		srID?: string;
	}[];
	season: number;
	phase: number;
	allBios: Basketball["bios"];
	allRetiredJerseyNumbers: Basketball["retiredJerseyNumbers"];
}) => {
	const playersBySlug = groupByUnique(
		players.filter((p) => p.srID !== undefined),
		"srID",
	);

	const teamsBySlug = groupByUnique(teams, (t) =>
		oldAbbrevTo2020BBGMAbbrev(t.srID),
	);

	for (const [teamSlug, rows] of Object.entries(allRetiredJerseyNumbers)) {
		const t = teamsBySlug[teamSlug];
		if (!t) {
			continue;
		}

		const retiredJerseyNumbers: Team["retiredJerseyNumbers"] = [];

		for (const row of rows) {
			const p = playersBySlug[row.slug];

			// Non-retired player - don't retire jersey
			if (p && p.tid !== PLAYER.RETIRED) {
				continue;
			}

			// Season hasn't happened yet - don't retire jersey
			if (
				row.season > season ||
				(row.season === season && phase <= PHASE.PLAYOFFS)
			) {
				continue;
			}

			if (p) {
				retiredJerseyNumbers.push({
					number: row.number,
					seasonRetired: row.season,
					seasonTeamInfo: row.season,
					pid: p.pid,
					score: 0,
					text: "",
				});
			} else {
				const bio = allBios[row.slug];
				const text = bio ? `${bio.pos} ${bio.name}` : row.slug;
				retiredJerseyNumbers.push({
					number: row.number,
					seasonRetired: row.season,
					seasonTeamInfo: row.season,
					score: 0,
					text,
				});
			}
		}

		if (retiredJerseyNumbers.length > 0) {
			t.retiredJerseyNumbers = retiredJerseyNumbers;
		}
	}
};

export default addRetiredJerseyNumbers;
