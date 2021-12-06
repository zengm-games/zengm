import PropTypes from "prop-types";
import {
	DataTable,
	MoreLinks,
	PlayerNameLabels,
	TeamLogoInline,
} from "../components";
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
				count: number;
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
		<div className="d-flex">
			<div className="mr-auto">
				<PlayerNameLabels pid={award.pid} pos={award.pos} season={season}>
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
			</div>
			<CountBadge count={award.count} />
		</div>
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
				{t.otl > 0 ? <>-{t.otl}</> : null}
				{t.tied > 0 ? <>-{t.tied}</> : null})
			</>
		);
	}

	// This happens if there is missing data, such as from Delete Old Data
	return "N/A";
};

const CountBadge = ({ count }: { count: number }) => {
	if (count > 1) {
		return (
			<div className="ml-1">
				<span className="badge badge-secondary align-text-bottom">{count}</span>
			</div>
		);
	}

	return null;
};

const formatTeam = (
	t: View<"historyAll">["seasons"][number]["champ"],
	season: number,
	userTid: number,
) => {
	if (!t) {
		return null;
	}

	return {
		classNames: t.tid === userTid ? "table-info py-1" : "py-1",
		value: (
			<div className="d-flex align-items-center">
				<TeamLogoInline imgURL={t.imgURL} imgURLSmall={t.imgURLSmall} />
				<div className="ml-1 mr-auto">
					{t.seed}. {teamName(t, season)}
				</div>
				<CountBadge count={t.count} />
			</div>
		),
		sortValue: `${t.region} ${t.name} ${season}`,
	};
};

const HistoryAll = ({ awards, seasons, userTid }: View<"historyAll">) => {
	useTitleBar({ title: "League History" });

	const cols = getCols([
		"Season",
		"League Champion",
		"Runner Up",
		...awards.map(award => `award:${award}`),
	]);

	const rows = seasons.map(s => {
		let seasonLink;
		if (s.champ) {
			seasonLink = (
				<a href={helpers.leagueUrl(["history", s.season])}>{s.season}</a>
			);
		} else {
			// This happens if there is missing data, such as from Delete Old Data
			seasonLink = String(s.season);
		}

		const champEl = formatTeam(s.champ, s.season, userTid);

		const runnerUpEl = formatTeam(s.runnerUp, s.season, userTid);

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
			<MoreLinks type="league" page="history_all" />

			<DataTable
				className="align-middle-all"
				legacyCols={cols}
				defaultSort={["col1", "desc"]}
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
