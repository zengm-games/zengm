import { DataTable, MoreLinks } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import type { View } from "../../common/types";

const PlayerName = ({
	p,
}: {
	p: {
		pid: number;
		name: string;
	};
}) => {
	if (!p) {
		return "???";
	}

	return <a href={helpers.leagueUrl(["player", p.pid])}>{p.name}</a>;
};

const PlayerTeam = ({
	p,
	season,
}: {
	p: {
		abbrev: string;
		tid: number;
	};
	season: number;
}) => {
	if (!p) {
		return "???";
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
	teamNames,
}: {
	gid?: number;
	overtimes?: number;
	score?: [number, number];
	season: number;
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

	return `${teamNames[tw]} ${score[tw]}, ${teamNames[tl]} ${score[tl]}${{
		overtimeText,
	}}`;
};
const ResultText = ({
	gid,
	overtimes,
	score,
	season,
	teamNames,
}: {
	gid?: number;
	overtimes?: number;
	score?: [number, number];
	season: number;
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
				{teamNames[tw]} {score[tw]}, {teamNames[tl]} {score[tl]}
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
		"MVP",
		"Team",
		"Dunk Winner",
		"Team",
		"Three-Point Winner",
		"Team",
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

		return {
			key: row.season,
			data: [
				row.season,
				{
					searchValue: rowResultText,
					sortValue: rowResultText,
					value: (
						// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20544
						// @ts-expect-error
						<ResultText
							gid={row.gid}
							overtimes={row.overtimes}
							score={row.score}
							season={row.season}
							teamNames={row.teamNames}
						/>
					),
				},
				{
					classNames: classNamesCaptain1,
					value: (
						// @ts-expect-error
						<PlayerName p={row.captain1}>
							{row.captain1 ? row.captain1.name : "???"}
						</PlayerName>
					),
				},
				{
					classNames: classNamesCaptain1,
					value: (
						// @ts-expect-error
						<PlayerTeam p={row.captain1} season={row.season}>
							{row.captain1 ? row.captain1.abbrev : "???"}
						</PlayerTeam>
					),
				},
				{
					classNames: classNamesCaptain2,
					value: (
						// @ts-expect-error
						<PlayerName p={row.captain2}>
							{row.captain2 ? row.captain2.name : "???"}
						</PlayerName>
					),
				},
				{
					classNames: classNamesCaptain2,
					value: (
						// @ts-expect-error
						<PlayerTeam p={row.captain2} season={row.season}>
							{row.captain2 ? row.captain2.abbrev : "???"}
						</PlayerTeam>
					),
				},
				{
					classNames: classNamesMVP,
					value: (
						// @ts-expect-error
						<PlayerName p={row.mvp}>
							{row.mvp ? row.mvp.name : "???"}
						</PlayerName>
					),
				},
				{
					classNames: classNamesMVP,
					value: (
						// @ts-expect-error
						<PlayerTeam p={row.mvp} season={row.season}>
							{row.mvp ? row.mvp.abbrev : "???"}
						</PlayerTeam>
					),
				},
				{
					classNames: classNamesDunk,
					value: (
						// @ts-expect-error
						<PlayerName p={row.dunk}>
							{row.dunk ? row.dunk.name : "???"}
						</PlayerName>
					),
				},
				{
					classNames: classNamesDunk,
					value: (
						// @ts-expect-error
						<PlayerTeam p={row.dunk} season={row.season}>
							{row.dunk ? row.dunk.abbrev : "???"}
						</PlayerTeam>
					),
				},
				{
					classNames: classNamesThree,
					value: (
						// @ts-expect-error
						<PlayerName p={row.three}>
							{row.three ? row.three.name : "???"}
						</PlayerName>
					),
				},
				{
					classNames: classNamesThree,
					value: (
						// @ts-expect-error
						<PlayerTeam p={row.three} season={row.season}>
							{row.three ? row.three.abbrev : "???"}
						</PlayerTeam>
					),
				},
				<>
					<a href={helpers.leagueUrl(["all_star", "draft", row.season])}>
						Draft Results
					</a>{" "}
					|{" "}
					<a href={helpers.leagueUrl(["all_star", "dunk", row.season])}>
						Dunk Contest
					</a>{" "}
					|{" "}
					<a href={helpers.leagueUrl(["all_star", "three", row.season])}>
						Three-Point Contest
					</a>
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
				name="AllStarHistory"
				pagination={pagination}
				rows={rows}
			/>
		</>
	);
};

export default AllStarHistory;
