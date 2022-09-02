import { DataTable, MoreLinks, TeamLogoInline } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import type { View } from "../../common/types";
import {
	CountBadge,
	wrappedPlayerNameLabels,
} from "../components/PlayerNameLabels";

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
		return {
			value: "N/A",
			sortValue: undefined,
		};
	}

	const wrappedValue = wrappedPlayerNameLabels({
		pid: award.pid,
		pos: award.pos,
		season: season,
		legacyName: award.name,
		abbrev: award.abbrev,
		tid: award.tid,
		count: award.count,
	});

	// This is our team.
	if (award.tid === userTid) {
		return {
			...wrappedValue,
			classNames: "table-info",
		};
	}

	return wrappedValue;
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
				({helpers.formatRecord(t)})
			</>
		);
	}

	// This happens if there is missing data, such as from Delete Old Data
	return "N/A";
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
				<div className="ms-1 me-auto">
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
				cols={cols}
				defaultSort={[0, "desc"]}
				defaultStickyCols={1}
				name="HistoryAll"
				pagination
				rows={rows}
			/>
		</>
	);
};

export default HistoryAll;
