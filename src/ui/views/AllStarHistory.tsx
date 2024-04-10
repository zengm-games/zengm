import { DataTable, MoreLinks } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import type { View } from "../../common/types";
import { wrappedPlayerNameLabels } from "../components/PlayerNameLabels";
import { isSport } from "../../common";

const playerName = (p?: { pid: number; name: string; count: number }) => {
	if (!p) {
		return {
			value: "",
			sortValue: undefined,
		};
	}

	return wrappedPlayerNameLabels({
		pid: p.pid,
		legacyName: p.name,
		count: p.count,
	});
};

const PlayerTeam = ({
	p,
	season,
}: {
	children: any;
	p:
		| {
				abbrev: string;
				tid: number;
		  }
		| undefined;
	season: number;
}) => {
	if (!p) {
		return "";
	}

	return (
		<a href={helpers.leagueUrl(["roster", `${p.abbrev}_${p.tid}`, season])}>
			{p.abbrev}
		</a>
	);
};

const resultText = ({
	gid,
	overtimes,
	score,
	sPts,
	teamNames,
}: {
	gid?: number;
	overtimes?: number;
	score?: [number, number];
	sPts?: [number, number];
	season: number;
	teamNames: [string, string];
}) => {
	if (gid === undefined || overtimes === undefined || score === undefined) {
		return "???";
	}

	const tw = score[0] >= score[1] ? 0 : 1;
	const tl = tw === 0 ? 1 : 0;

	let overtimeText = "";

	// Ignore baseball, don't want to worry about numPeriods
	if (!isSport("baseball")) {
		if (overtimes === 1) {
			overtimeText = " (OT)";
		} else if (overtimes > 1) {
			overtimeText = ` (${overtimes}OT)`;
		}
	}

	return `${teamNames[tw]} ${score[tw]}${sPts ? ` (${sPts[tw]})` : ""}, ${teamNames[tl]} ${score[tl]}${sPts ? ` (${sPts[tl]})` : ""},${{
		overtimeText,
	}}`;
};
const ResultText = ({
	gid,
	overtimes,
	score,
	season,
	sPts,
	teamNames,
}: {
	gid?: number;
	overtimes?: number;
	score?: [number, number];
	season: number;
	sPts?: [number, number];
	teamNames: [string, string];
}) => {
	if (gid === undefined || overtimes === undefined || score === undefined) {
		return "???";
	}

	const tw = score[0] >= score[1] ? 0 : 1;
	const tl = tw === 0 ? 1 : 0;

	let overtimeText = "";
	if (overtimes === 1) {
		overtimeText = " (OT)";
	} else if (overtimes > 1) {
		overtimeText = ` (${overtimes}OT)`;
	}

	return (
		<>
			<a href={helpers.leagueUrl(["game_log", "special", season, gid])}>
				{teamNames[tw]} {score[tw]}
				{sPts ? ` (${sPts[tw]})` : ""}, {teamNames[tl]} {score[tl]}
				{sPts ? ` (${sPts[tl]})` : ""}
			</a>
			{overtimeText}
		</>
	);
};

const AllStarHistory = ({ allAllStars, userTid }: View<"allStarHistory">) => {
	useTitleBar({ title: "All-Star History" });

	const cols = getCols([
		"Season",
		"Result",
		"Captain 1",
		"Team",
		"Captain 2",
		"Team",
		"award:mvp",
		"Team",
		...(isSport("basketball")
			? ["Dunk Winner", "Team", "Three-Point Winner", "Team"]
			: []),
		"Links",
	]);

	const rows = allAllStars.map(row => {
		const classNamesCaptain1 =
			row.captain1 && row.captain1.tid === userTid ? "table-info" : "";
		const classNamesCaptain2 =
			row.captain2 && row.captain2.tid === userTid ? "table-info" : "";
		const classNamesMVP =
			row.mvp && row.mvp.tid === userTid ? "table-info" : "";
		const classNamesDunk =
			row.dunk && row.dunk.tid === userTid ? "table-info" : "";
		const classNamesThree =
			row.three && row.three.tid === userTid ? "table-info" : "";

		const rowResultText = resultText(row);
		console.log(row);

		return {
			key: row.season,
			data: [
				row.season,
				{
					searchValue: rowResultText,
					sortValue: rowResultText,
					value: (
						<ResultText
							gid={row.gid}
							overtimes={row.overtimes}
							score={row.score}
							season={row.season}
							sPts={row.sPts}
							teamNames={row.teamNames}
						/>
					),
				},
				{
					...playerName(row.captain1),
					classNames: classNamesCaptain1,
				},
				{
					classNames: classNamesCaptain1,
					value: (
						<PlayerTeam p={row.captain1} season={row.season}>
							{row.captain1 ? row.captain1.abbrev : "???"}
						</PlayerTeam>
					),
				},
				{
					...playerName(row.captain2),
					classNames: classNamesCaptain2,
				},
				{
					classNames: classNamesCaptain2,
					value: (
						<PlayerTeam p={row.captain2} season={row.season}>
							{row.captain2 ? row.captain2.abbrev : "???"}
						</PlayerTeam>
					),
				},
				{
					...playerName(row.mvp),
					classNames: classNamesMVP,
				},
				{
					classNames: classNamesMVP,
					value: (
						<PlayerTeam p={row.mvp} season={row.season}>
							{row.mvp ? row.mvp.abbrev : "???"}
						</PlayerTeam>
					),
				},
				...(isSport("basketball")
					? [
							{
								...playerName(row.dunk),
								classNames: classNamesDunk,
							},
							{
								classNames: classNamesDunk,
								value: (
									<PlayerTeam p={row.dunk} season={row.season}>
										{row.dunk ? row.dunk.abbrev : "???"}
									</PlayerTeam>
								),
							},
							{
								...playerName(row.three),
								classNames: classNamesThree,
							},
							{
								classNames: classNamesThree,
								value: (
									<PlayerTeam p={row.three} season={row.season}>
										{row.three ? row.three.abbrev : "???"}
									</PlayerTeam>
								),
							},
						]
					: []),
				<>
					<a href={helpers.leagueUrl(["all_star", "teams", row.season])}>
						{row.type === "draft" ? "Draft Results" : "View Teams"}
					</a>
					{isSport("basketball") ? (
						<>
							{row.dunk ? (
								<>
									{" "}
									|{" "}
									<a href={helpers.leagueUrl(["all_star", "dunk", row.season])}>
										Dunk Contest
									</a>
								</>
							) : null}
							{row.three ? (
								<>
									{" "}
									|{" "}
									<a
										href={helpers.leagueUrl(["all_star", "three", row.season])}
									>
										Three-Point Contest
									</a>
								</>
							) : null}
						</>
					) : null}
				</>,
			],
		};
	});

	const pagination = rows.length > 100;

	return (
		<>
			<MoreLinks type="league" page="all_star_history" />

			<DataTable
				cols={cols}
				defaultSort={[0, "desc"]}
				defaultStickyCols={window.mobile ? 0 : 1}
				name="AllStarHistory"
				pagination={pagination}
				rows={rows}
			/>
		</>
	);
};

export default AllStarHistory;
