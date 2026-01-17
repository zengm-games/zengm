import { DataTable, MoreLinks } from "../components/index.tsx";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { getCols, helpers } from "../util/index.ts";
import type { View } from "../../common/types.ts";
import type { DataTableRow } from "../components/DataTable/index.tsx";
import { orderBy } from "../../common/utils.ts";
import Note from "./Player/Note.tsx";

const processRows = ({
	challengeNoRatings,
	draftPicks,
	outgoing,
}: Pick<View<"draftPicks">, "challengeNoRatings" | "draftPicks"> & {
	outgoing: boolean;
}) => {
	const rows: DataTableRow[] = orderBy(
		draftPicks,
		[
			"season",
			"round",
			(dp) => (dp.pick > 0 ? dp.pick : (dp.projectedPick ?? 0)),
			"powerRanking",
		],
		["asc", "asc", "asc", "asc"],
	).map((dp) => {
		return {
			key: dp.dpid,
			data: [
				dp.season === "fantasy"
					? {
							value: "Fantasy",
							sortValue: -Infinity,
						}
					: dp.season === "expansion"
						? {
								value: "Expansion",
								sortValue: -Infinity,
							}
						: dp.season,
				dp.round,
				dp.pick > 0 ? (
					dp.pick
				) : dp.projectedPick !== undefined ? (
					<i className="text-body-secondary">{dp.projectedPick}</i>
				) : null,
				dp.originalTid !== dp.tid ? (
					outgoing ? (
						<a href={helpers.leagueUrl(["roster", `${dp.abbrev}_${dp.tid}`])}>
							{dp.abbrev}
						</a>
					) : (
						<a
							href={helpers.leagueUrl([
								"roster",
								`${dp.originalAbbrev}_${dp.originalTid}`,
							])}
						>
							{dp.originalAbbrev}
						</a>
					)
				) : null,
				dp.powerRanking,
				!challengeNoRatings ? dp.ovr : null,
				helpers.formatRecord(dp.record),
				dp.avgAge?.toFixed(1),
				dp.trades
					? {
							value: (
								<>
									{dp.originalAbbrev}
									{dp.trades.map((info) => {
										return (
											<>
												{" "}
												→{" "}
												<a
													href={helpers.leagueUrl(["trade_summary", info.eid])}
												>
													{info.abbrev}
												</a>
											</>
										);
									})}
								</>
							),
							searchValue: `${dp.originalAbbrev}${dp.trades.map((info) => ` → ${info.abbrev}`)}`,
							sortValue: dp.trades.length,
						}
					: null,
				{
					value: (
						<Note
							note={dp.note}
							info={{
								type: "draftPick",
								dpid: dp.dpid,
							}}
							infoLink
							xs
						/>
					),
					searchValue: dp.note,
					sortValue: dp.note,
				},
			],
		};
	});

	return rows;
};

export const getDraftPicksColsAndRows = ({
	challengeNoRatings,
	draftPicks,
	draftPicksOutgoing,
}: Pick<
	View<"draftPicks">,
	"challengeNoRatings" | "draftPicks" | "draftPicksOutgoing"
>) => {
	const cols = getCols(
		[
			"Year",
			"Draft Round",
			"Draft Pick",
			"Team",
			"Power Ranking",
			"Ovr",
			"Record",
			"AvgAge",
			"Trades",
			"Note",
		],
		{
			"Draft Round": {
				title: "Round",
			},
			"Draft Pick": {
				title: "Pick",
			},
			AvgAge: {
				title: "Avg Age",
			},
			Ovr: {
				title: "Team Ovr",
			},
			Note: {
				classNames: "w-100",
			},
		},
	);

	const rows = processRows({
		challengeNoRatings,
		draftPicks,
		outgoing: false,
	});

	const rowsOutgoing = processRows({
		challengeNoRatings,
		draftPicks: draftPicksOutgoing,
		outgoing: true,
	});

	return {
		cols,
		rows,
		rowsOutgoing,
	};
};

const DraftPicks = ({
	abbrev,
	challengeNoRatings,
	draftPicks,
	draftPicksOutgoing,
	draftType,
	tid,
}: View<"draftPicks">) => {
	useTitleBar({
		title: "Draft Picks",
		dropdownView: "draft_picks",
		dropdownFields: { teams: abbrev },
	});

	const { rows, rowsOutgoing, cols } = getDraftPicksColsAndRows({
		challengeNoRatings,
		draftPicks,
		draftPicksOutgoing,
	});

	return (
		<>
			<MoreLinks
				type="draft"
				page="draft_picks"
				abbrev={abbrev}
				draftType={draftType}
				tid={tid}
			/>

			<p>
				Projected draft pick numbers are shown in{" "}
				<i className="text-body-secondary">faded italics</i>.
			</p>

			{rows.length > 0 ? (
				<DataTable
					cols={cols}
					defaultSort={[0, "asc"]}
					name="DraftPicks"
					rows={rows}
					title={<h2>Owned picks</h2>}
				/>
			) : (
				<>
					<h2>Owned picks</h2>
					<p>None</p>
				</>
			)}

			{rowsOutgoing.length > 0 ? (
				<DataTable
					cols={cols}
					defaultSort={[0, "asc"]}
					name="DraftPicksOutgoing"
					rows={rowsOutgoing}
					title={<h2>Outgoing picks</h2>}
				/>
			) : (
				<>
					<h2>Outgoing picks</h2>
					<p>None</p>
				</>
			)}
		</>
	);
};

export default DraftPicks;
