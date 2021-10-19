import type { RealPlayerPhotos, RealTeamInfo } from "../../../../common/types";
import { idb } from "../../../db";

const getRealTeamPlayerData = async ({
	fileHasPlayers,
	fileHasTeams,
}: {
	fileHasPlayers: boolean;
	fileHasTeams: boolean;
}) => {
	const realPlayerPhotos = (
		fileHasPlayers
			? await idb.meta.get("attributes", "realPlayerPhotos")
			: undefined
	) as RealPlayerPhotos | undefined;

	const realTeamInfo = (
		fileHasTeams ? await idb.meta.get("attributes", "realTeamInfo") : undefined
	) as RealTeamInfo | undefined;
	if (realTeamInfo) {
		const currentSeason =
			leagueFile.gameAttributes?.season ?? leagueFile.startingSeason;

		if (leagueFile.teams) {
			for (const t of leagueFile.teams) {
				applyRealTeamInfo(t, realTeamInfo, currentSeason);

				// This is especially needed for new real players leagues started after the regular season. Arguably makes sense to always do, for consistency, since applyRealTeamInfo will override the current logos anyway, might as well do the historical ones too. But let's be careful.
				if (getLeagueOptions && t.seasons) {
					for (const teamSeason of t.seasons) {
						applyRealTeamInfo(teamSeason, realTeamInfo, teamSeason.season, {
							srIDOverride: teamSeason.srID ?? t.srID,
						});
					}
				}
			}
		}
	}

	return {
		realPlayerPhotos,
		realTeamInfo,
	};
};

export default getRealTeamPlayerData;
