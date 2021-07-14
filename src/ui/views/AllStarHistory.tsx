import PropTypes from "prop-types";
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
PlayerName.propTypes = {
	p: PropTypes.shape({
		abbrev: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		pid: PropTypes.number.isRequired,
		tid: PropTypes.number.isRequired,
	}),
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
PlayerTeam.propTypes = {
	p: PropTypes.shape({
		abbrev: PropTypes.string.isRequired,
		tid: PropTypes.number.isRequired,
	}),
	season: PropTypes.number.isRequired,
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
ResultText.propTypes = {
	gid: PropTypes.number,
	overtimes: PropTypes.number,
	score: PropTypes.arrayOf(PropTypes.number),
	season: PropTypes.number.isRequired,
	teamNames: PropTypes.arrayOf(PropTypes.string).isRequired,
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
	]);

	const rows = allAllStars.map(row => {
		const classNamesCaptain1 =
			row.captain1 && row.captain1.tid === userTid ? "table-info" : "";
		const classNamesCaptain2 =
			row.captain2 && row.captain2.tid === userTid ? "table-info" : "";
		const classNamesMVP =
			row.mvp && row.mvp.tid === userTid ? "table-info" : "";

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
						// @ts-ignore
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
						// @ts-ignore
						<PlayerName p={row.captain1}>
							{row.captain1 ? row.captain1.name : "???"}
						</PlayerName>
					),
				},
				{
					classNames: classNamesCaptain1,
					value: (
						// @ts-ignore
						<PlayerTeam p={row.captain1} season={row.season}>
							{row.captain1 ? row.captain1.abbrev : "???"}
						</PlayerTeam>
					),
				},
				{
					classNames: classNamesCaptain2,
					value: (
						// @ts-ignore
						<PlayerName p={row.captain2}>
							{row.captain2 ? row.captain2.name : "???"}
						</PlayerName>
					),
				},
				{
					classNames: classNamesCaptain2,
					value: (
						// @ts-ignore
						<PlayerTeam p={row.captain2} season={row.season}>
							{row.captain2 ? row.captain2.abbrev : "???"}
						</PlayerTeam>
					),
				},
				{
					classNames: classNamesMVP,
					value: (
						// @ts-ignore
						<PlayerName p={row.mvp}>
							{row.mvp ? row.mvp.name : "???"}
						</PlayerName>
					),
				},
				{
					classNames: classNamesMVP,
					value: (
						// @ts-ignore
						<PlayerTeam p={row.mvp} season={row.season}>
							{row.mvp ? row.mvp.abbrev : "???"}
						</PlayerTeam>
					),
				},
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

AllStarHistory.propTypes = {
	allAllStars: PropTypes.arrayOf(PropTypes.object).isRequired,
	userTid: PropTypes.number.isRequired,
};

export default AllStarHistory;
