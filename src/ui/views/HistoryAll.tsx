import PropTypes from "prop-types";
import React from "react";
import { DataTable, PlayerNameLabels } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import type { View } from "../../common/types";

const awardName = (
	award:
		| {
				pid: number;
				pos: string;
				name: string;
				tid: number;
				abbrev: string;
		  }
		| undefined,
	season: number,
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
					`${award.abbrev}_${award.tid}`,
					season,
				])}
			>
				{award.abbrev}
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
) => {
	if (t) {
		return (
			<>
				<a href={helpers.leagueUrl(["roster", `${t.abbrev}_${t.tid}`, season])}>
					{t.region}
				</a>{" "}
				({t.won}-{t.lost}
				{t.tied > 0 ? <>-{t.tied}</> : null})
			</>
		);
	}

	// This happens if there is missing data, such as from Delete Old Data
	return "N/A";
};

const HistoryAll = ({ awards, seasons, userTid }: View<"historyAll">) => {
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

		const champEl = s.champ
			? {
					classNames: s.champ.tid === userTid ? "table-info" : undefined,
					value: (
						<>
							{s.champ.seed}. {teamName(s.champ, s.season)}
							{countText}
						</>
					),
					sortValue: `${s.champ.region} ${s.champ.name} ${s.season}`,
			  }
			: null;

		const runnerUpEl = s.runnerUp
			? {
					classNames: s.runnerUp.tid === userTid ? "table-info" : undefined,
					value: (
						<>
							{s.runnerUp.seed}. {teamName(s.runnerUp, s.season)}
						</>
					),
					sortValue: `${s.runnerUp.region} ${s.runnerUp.name} ${s.season}`,
			  }
			: null;

		return {
			key: s.season,
			data: [
				seasonLink,
				champEl,
				runnerUpEl,
				...awards.map(award => awardName(s[award], s.season, userTid)),
			],
		};
	});

	return (
		<>
			<p>
				More: <a href={helpers.leagueUrl(["league_stats"])}>League Stats</a> |{" "}
				<a href={helpers.leagueUrl(["team_records"])}>Team Records</a> |{" "}
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
	userTid: PropTypes.number.isRequired,
};

export default HistoryAll;
