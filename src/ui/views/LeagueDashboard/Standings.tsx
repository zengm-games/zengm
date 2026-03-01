import clsx from "clsx";
import { helpers } from "../../util/index.ts";
import { ColPtsOrGB, TeamColumn } from "../Standings.tsx";
import type { View } from "../../../common/types.ts";

const width100 = {
	width: "100%",
};

const Standings = ({
	confOrAllTeams,
	maxPlayoffSeed,
	maxPlayoffSeedNoPlayIn,
	playoffsByConf,
	pointsFormula,
	usePts,
	userTid,
}: Pick<
	View<"leagueDashboard">,
	| "confOrAllTeams"
	| "maxPlayoffSeed"
	| "maxPlayoffSeedNoPlayIn"
	| "playoffsByConf"
	| "pointsFormula"
	| "usePts"
	| "userTid"
>) => {
	const maxRank = Math.max(...confOrAllTeams.map((t) => t.rank));

	return (
		<>
			<table className="table table-striped table-borderless table-sm mb-1">
				<thead>
					<tr>
						<th style={width100}>{playoffsByConf ? "Conference" : "League"}</th>
						<ColPtsOrGB
							alignRight
							pointsFormula={pointsFormula}
							usePts={usePts}
						/>
					</tr>
				</thead>
				<tbody>
					{confOrAllTeams.map((t, i) => {
						return (
							<tr
								key={t.tid}
								className={clsx({
									separator:
										(i === maxPlayoffSeed - 1 ||
											i === maxPlayoffSeedNoPlayIn - 1) &&
										i < confOrAllTeams.length - 1,
									"table-info": t.tid === userTid,
								})}
							>
								<TeamColumn rank={t.rank} maxRank={maxRank} t={t} />
								<td className="text-end">
									{usePts ? Math.round(t.seasonAttrs.pts) : t.gb}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
			<a href={helpers.leagueUrl(["standings"])}>» League Standings</a>
		</>
	);
};

export default Standings;
