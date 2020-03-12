import PropTypes from "prop-types";
import React from "react";
import { DataTable, PlayerNameLabels } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import { View } from "../../common/types";

const awardName = (
	award: {
		pid: number;
		pos: string;
		name: string;
		tid: number;
	},
	season: number,
	teamAbbrevsCache: string[],
	userTid: number,
) => {
	if (!award) {
		// For old seasons with no Finals MVP
		return "N/A";
	}

	const ret = (
		<>
			<PlayerNameLabels pid={award.pid} pos={award.pos}>
				{award.name}
			</PlayerNameLabels>{" "}
			(
			<a
				href={helpers.leagueUrl([
					"roster",
					teamAbbrevsCache[award.tid],
					season,
				])}
			>
				{teamAbbrevsCache[award.tid]}
			</a>
			)
		</>
	);

	// This is our team.
	if (award.tid === userTid) {
		return {
			classNames: "table-info",
			value: ret,
		};
	}
	return ret;
};

const teamName = (
	t: View<"historyAll">["seasons"][number]["champ"],
	season: number,
	ties: boolean,
) => {
	if (t) {
		return (
			<>
				<a href={helpers.leagueUrl(["roster", t.abbrev, season])}>{t.region}</a>{" "}
				({t.won}-{t.lost}
				{ties ? <>-{t.tied}</> : null})
			</>
		);
	}

	// This happens if there is missing data, such as from Delete Old Data
	return "N/A";
};

const HistoryAll = ({
	awards,
	seasons,
	teamAbbrevsCache,
	ties,
	userTid,
}: View<"historyAll">) => {
	useTitleBar({ title: "League History" });

	const cols = getCols(
		"Season",
		"League Champion",
		"Runner Up",
		...awards.map(award => `award:${award}`),
	);

	const rows = seasons.map(s => {
		let countText;
		let seasonLink;
		if (s.champ) {
			seasonLink = (
				<a href={helpers.leagueUrl(["history", s.season])}>{s.season}</a>
			);
			countText = ` - ${helpers.ordinal(s.champ.count)} title`;
		} else {
			// This happens if there is missing data, such as from Delete Old Data
			seasonLink = String(s.season);
			countText = null;
		}

		const champEl = {
			classNames: s.champ && s.champ.tid === userTid ? "table-info" : undefined,
			value: (
				<>
					{s.champ.seed}. {teamName(s.champ, s.season, ties)}
					{countText}
				</>
			),
			sortValue: `${s.champ.region} ${s.champ.name} ${s.season}`,
		};

		const runnerUpEl = {
			classNames:
				s.runnerUp && s.runnerUp.tid === userTid ? "table-info" : undefined,
			value: (
				<>
					{s.runnerUp.seed}. {teamName(s.runnerUp, s.season, ties)}
				</>
			),
			sortValue: `${s.runnerUp.region} ${s.runnerUp.name} ${s.season}`,
		};

		return {
			key: s.season,
			data: [
				seasonLink,
				champEl,
				runnerUpEl,
				...awards.map(award =>
					awardName(s[award], s.season, teamAbbrevsCache, userTid),
				),
			],
		};
	});

	return (
		<>
			<p>
				More: <a href={helpers.leagueUrl(["team_records"])}>Team Records</a> |{" "}
				<a href={helpers.leagueUrl(["awards_records"])}>Awards Records</a>
				{process.env.SPORT === "basketball" ? (
					<>
						{" "}
						|{" "}
						<a href={helpers.leagueUrl(["all_star_history"])}>
							All-Star History
						</a>
					</>
				) : null}
			</p>

			<DataTable
				cols={cols}
				defaultSort={[0, "desc"]}
				name="HistoryAll"
				pagination
				rows={rows}
			/>
		</>
	);
};

HistoryAll.propTypes = {
	awards: PropTypes.arrayOf(PropTypes.string).isRequired,
	seasons: PropTypes.arrayOf(PropTypes.object).isRequired,
	teamAbbrevsCache: PropTypes.arrayOf(PropTypes.string).isRequired,
	ties: PropTypes.bool.isRequired,
	userTid: PropTypes.number.isRequired,
};

export default HistoryAll;
