import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import { DataTable } from "../components";
import type { View } from "../../common/types";
import { frivolitiesMenu } from "./Frivolities";
import { getValue } from "./Most";
import { isSport } from "../../common";
import { wrappedMovOrDiff } from "../components/MovOrDiff";

const FrivolitiesTeamSeasons = ({
	description,
	extraCols,
	teamSeasons,
	ties,
	otl,
	title,
	type,
	usePts,
	userTid,
}: View<"frivolitiesTeamSeasons">) => {
	useTitleBar({ title, customMenu: frivolitiesMenu });

	const cols = getCols([
		"#",
		"Team",
		"Season",
		"W",
		"L",
		...(otl ? ["OTL"] : []),
		...(ties ? ["T"] : []),
		...(usePts ? ["PTS", "PTS%"] : ["%"]),
		`stat:${isSport("basketball") ? "mov" : "diff"}`,
		...extraCols.map(x => x.colName),
		"Links",
	]);

	const rows = teamSeasons.map(ts => {
		return {
			key: ts.rank,
			data: [
				ts.rank,
				<a
					href={helpers.leagueUrl([
						"roster",
						`${ts.abbrev}_${ts.tid}`,
						ts.season,
					])}
				>
					{ts.region} {ts.name}
				</a>,
				ts.season,
				ts.won,
				ts.lost,
				...(otl ? [ts.otl] : []),
				...(ties ? [ts.tied] : []),
				...(usePts
					? [Math.round(ts.standingsPts), helpers.roundWinp(ts.ptsPct)]
					: [helpers.roundWinp(ts.winp)]),
				wrappedMovOrDiff(
					isSport("basketball")
						? {
								pts: ts.pts * ts.gp,
								oppPts: ts.oppPts * ts.gp,
								gp: ts.gp,
						  }
						: ts,
					isSport("basketball") ? "mov" : "diff",
				),
				...extraCols.map(x => {
					const value = getValue(ts, x.key);
					if (x.keySort) {
						const sortValue = getValue(ts, x.keySort);

						return {
							value,
							sortValue,
						};
					}
					return value;
				}),
				<>
					<a href={helpers.leagueUrl(["standings", ts.season])}>Standings</a> |{" "}
					<a href={helpers.leagueUrl(["playoffs", ts.season])}>Playoffs</a>
				</>,
			],
			classNames: {
				"table-info": ts.tid === userTid,
			},
		};
	});

	return (
		<>
			{description ? <p>{description}</p> : null}

			<DataTable
				cols={cols}
				defaultSort={[0, "asc"]}
				name={`FrivolitiesTeamSeasons_${type}`}
				nonfluid
				rows={rows}
			/>
		</>
	);
};

export default FrivolitiesTeamSeasons;
