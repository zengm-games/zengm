import { DataTable, MoreLinks } from "../components/index.tsx";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { getCols, helpers } from "../util/index.ts";
import type { View } from "../../common/types.ts";
import type { DataTableRow } from "../components/DataTable/index.tsx";
import { orderBy } from "../../common/utils.ts";
import Note from "./Player/Note.tsx";

export const getDraftPicksColsAndRows = ({
	challengeNoRatings,
	draftPicks,
}: Pick<View<"draftPicks">, "challengeNoRatings" | "draftPicks">) => {
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
					<a
						href={helpers.leagueUrl([
							"roster",
							`${dp.originalAbbrev}_${dp.originalTid}`,
						])}
					>
						{dp.originalAbbrev}
					</a>
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

	return {
		cols,
		rows,
	};
};

const DraftPicks = ({
	abbrev,
	challengeNoRatings,
	draftPicks,
	draftType,
	tid,
}: View<"draftPicks">) => {
	useTitleBar({
		title: "Draft Picks",
		dropdownView: "draft_picks",
		dropdownFields: { teams: abbrev },
	});

	const { rows, cols } = getDraftPicksColsAndRows({
		challengeNoRatings,
		draftPicks,
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

			<DataTable
				cols={cols}
				defaultSort={[0, "asc"]}
				name="DraftPicks"
				rows={rows}
			/>
		</>
	);
};

export default DraftPicks;
