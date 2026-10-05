import clsx from "clsx";
import { Fragment, useState } from "react";
import useTitleBar from "../../hooks/useTitleBar.tsx";
import { helpers } from "../../util/helpers.ts";
import { toWorker } from "../../util/toWorker.ts";
import { getCols } from "../../../common/getCols.ts";
import { useLocal } from "../../util/local.ts";
import { DataTable } from "../../components/DataTable/index.tsx";
import { MoreLinks } from "../../components/MoreLinks.tsx";
import type { View } from "../../../common/types.ts";
import {
	wrappedContractAmount,
	wrappedContractExp,
} from "../../components/contract.tsx";
import { wrappedPlayerNameLabels } from "../../components/PlayerNameLabels.tsx";
import type { DataTableRow } from "../../components/DataTable/index.tsx";
import { arrayMove } from "@dnd-kit/sortable";
import { groupByUnique } from "../../../common/utils.ts";
import { StickyDraftInfo } from "./StickyDraftInfo.tsx";
import { wrappedDraftAbbrev } from "../../components/DraftAbbrev.tsx";
import { RosterComposition } from "../../components/RosterComposition.tsx";
import { confirm } from "../../util/confirm.tsx";
import { getCol } from "../../../common/getCol.ts";
import { PHASE } from "../../../common/constants.ts";
import { getNumericStat } from "../../../common/statValue.ts";

const DRAFT_BAR_HEIGHT = 82;

type DraftedRow = View<"draft">["drafted"][number];

// Placeholder rows for remaining draft picks have pid -1
type RemainingPick = Extract<DraftedRow, { pid: -1 }>;
type DraftedPlayer = Exclude<DraftedRow, RemainingPick>;

const isDraftedPlayer = (p: DraftedRow): p is DraftedPlayer => p.pid >= 0;
const isRemainingPick = (p: DraftedRow): p is RemainingPick => p.pid < 0;

const Draft = ({
	challengeNoDraftPicks,
	drafted,
	expansionDraftFilteredTeamsMessage,
	fantasyDraft,
	stats,
	teamsByTid,
	undrafted,
	userNextPickYear,
	userPlayers,
}: View<"draft">) => {
	const {
		challengeNoRatings,
		draftType,
		godMode,
		phase,
		season,
		spectator,
		teamInfoCache,
		userTid,
		userTids,
	} = useLocal([
		"challengeNoRatings",
		"draftType",
		"godMode",
		"phase",
		"season",
		"spectator",
		"teamInfoCache",
		"userTid",
		"userTids",
	]);
	const expansionDraft = phase === PHASE.EXPANSION_DRAFT;

	const [drafting, setDrafting] = useState(false);

	const [editDraftOrder, setEditDraftOrder] = useState(false);
	const [sortedDpids, setSortedDpids] = useState<number[] | undefined>(
		undefined,
	);
	const [prevDrafted, setPrevDrafted] = useState(drafted);

	if (drafted !== prevDrafted) {
		setSortedDpids(undefined);
		setPrevDrafted(drafted);
	}

	// Use the result of drag and drop to sort drafted players and picks, before the "official" order comes back as props
	let draftedSorted: DraftedRow[];
	if (sortedDpids !== undefined) {
		const draftedPlayers = drafted.filter(isDraftedPlayer);
		const remainingPicksUnsorted = drafted.filter(isRemainingPick);
		const remainingPicksByDpid = groupByUnique(
			remainingPicksUnsorted,
			(p) => p.draft.dpid,
		);
		draftedSorted = [
			// Drafted players always at top
			...draftedPlayers,

			// Then draft picks follow
			...sortedDpids.flatMap((dpid, i) => {
				const row = remainingPicksByDpid[dpid];
				const dpToTakeOrderFrom = remainingPicksUnsorted[i]?.draft;
				if (!row || !dpToTakeOrderFrom) {
					return [];
				}

				return [
					{
						...row,
						draft: {
							...row.draft,

							// Need to manually update round/pick for instant feedback rather than waiting for the server to update, because otherwise all this sortedDpids stuff is useless because the sort of the DataTable overrides it
							round: dpToTakeOrderFrom.round,
							pick: dpToTakeOrderFrom.pick,
						},
					},
				];
			}),
		];
	} else {
		draftedSorted = drafted;
	}

	const draftUser = async (pid: number, simToNextUserPick = false) => {
		setDrafting(true);
		await toWorker("main", "draftUser", pid);
		setDrafting(false);

		if (simToNextUserPick) {
			await toWorker("playMenu", "untilYourNextPick", undefined);
		}
	};

	useTitleBar({
		title: fantasyDraft
			? "Fantasy Draft"
			: expansionDraft
				? "Expansion Draft"
				: "Draft",
	});
	const remainingPicks = draftedSorted.filter(isRemainingPick);
	const nextPick = remainingPicks[0];
	const usersTurn = !!(nextPick && userTids.includes(nextPick.draft.tid));

	const canEditDraftOrder = godMode && remainingPicks.length > 0;

	const sortableRows = editDraftOrder && canEditDraftOrder;

	const colsUndrafted = getCols(
		["#", "Name", "Pos", "Age", "Ovr", "Pot", "Draft"],
		{
			Name: {
				width: "100%",
			},
		},
	);

	if (fantasyDraft || expansionDraft) {
		colsUndrafted.splice(
			6,
			0,
			...getCols(["Contract", "Exp", ...stats.map((stat) => `stat:${stat}`)]),
		);
	}

	if (expansionDraft) {
		colsUndrafted.splice(3, 0, ...getCols(["Team"]));
	}

	const rowsUndrafted: DataTableRow<"player">[] = undrafted.map((p) => {
		const data: DataTableRow["data"] = [
			p.rank,
			wrappedPlayerNameLabels({
				pid: p.pid,
				injury: p.injury,
				skills: p.ratings.skills,
				defaultWatch: p.watch,
				firstName: p.firstName,
				firstNameShort: p.firstNameShort,
				lastName: p.lastName,
			}),
			p.ratings.pos,
			p.age,
			!challengeNoRatings ? p.ratings.ovr : null,
			!challengeNoRatings ? p.ratings.pot : null,
			spectator ? null : (
				<div
					className="btn-group"
					style={{
						display: "flex",
					}}
				>
					<button
						className="btn btn-xs btn-primary"
						disabled={!usersTurn || drafting}
						onClick={() => draftUser(p.pid)}
						title="Draft player"
					>
						Draft
					</button>
					<button
						className="btn btn-xs btn-light-bordered"
						disabled={!usersTurn || drafting}
						onClick={() => draftUser(p.pid, true)}
						title="Draft player and sim to your next pick or end of draft"
					>
						and sim
					</button>
				</div>
			),
		];

		if (fantasyDraft || expansionDraft) {
			data.splice(
				6,
				0,
				wrappedContractAmount(p),
				wrappedContractExp(p),
				...stats.map((stat) => helpers.roundStat(p.stats[stat], stat)),
			);
		}

		if (expansionDraft) {
			data.splice(
				3,
				0,
				<a href={helpers.leagueUrl(["roster", `${p.abbrev}_${p.tid}`])}>
					{p.abbrev}
				</a>,
			);
		}

		return {
			key: p.pid,
			metadata: {
				type: "player",
				pid: p.pid,
				season,
				playoffs: "regularSeason",
			},
			data,
		};
	});

	const colsDrafted = getCols(["Pick", "Team"]).concat(
		colsUndrafted.slice(1, -1),
	);

	if (expansionDraft) {
		colsDrafted.splice(4, 1);
		colsDrafted.splice(2, 0, getCol("From"));
	}

	const rowsDrafted: DataTableRow<"player">[] = draftedSorted.map((p) => {
		// Team before the draft, for fantasy/expansion drafts
		const prevAbbrev = isDraftedPlayer(p) ? p.prevAbbrev : undefined;
		const prevTid = isDraftedPlayer(p) ? p.prevTid : undefined;

		const data: DataTableRow["data"] = [
			`${p.draft.round}-${p.draft.pick}`,
			wrappedDraftAbbrev(
				{
					originalTid: p.draft.originalTid,
					tid: p.draft.tid,
					originalT: teamsByTid[p.draft.originalTid],
					t: teamsByTid[p.draft.tid],
				},
				teamInfoCache,
			),
			isDraftedPlayer(p) ? (
				wrappedPlayerNameLabels({
					pid: p.pid,
					injury: p.injury,
					skills: p.ratings.skills,
					defaultWatch: p.watch,
					firstName: p.firstName,
					firstNameShort: p.firstNameShort,
					lastName: p.lastName,
				})
			) : (
				<>
					<button
						className="btn btn-xs btn-light-bordered"
						disabled={drafting}
						onClick={async () => {
							if (!spectator) {
								let numUserPicksBefore = 0;
								for (const p2 of draftedSorted) {
									if (p2.draft.dpid === p.draft.dpid) {
										break;
									}

									if (p2.pid === -1 && userTids.includes(p2.draft.tid)) {
										numUserPicksBefore += 1;
									}
								}

								if (numUserPicksBefore > 0) {
									const proceed = await confirm(
										`Your ${helpers.plural(
											"team controls",
											userTids.length,
											"teams control",
										)} ${numUserPicksBefore} ${helpers.plural(
											"pick",
											numUserPicksBefore,
										)} before this one. The AI will make ${helpers.plural(
											"that draft pick",
											numUserPicksBefore,
											"those draft picks",
										)} for you if you choose to sim to this pick.`,
										{
											okText: `Let AI Make My ${helpers.plural(
												"Pick",
												numUserPicksBefore,
											)}`,
											cancelText: "Cancel",
										},
									);

									if (!proceed) {
										return;
									}
								}
							}

							await toWorker("actions", "untilPick", p.draft.dpid);
						}}
					>
						Sim to pick
					</button>
					{!fantasyDraft && !expansionDraft && !spectator ? (
						userTid === p.draft.tid ? (
							<button
								className="btn btn-xs btn-light-bordered ms-2"
								disabled={drafting}
								onClick={async () => {
									await toWorker("actions", "addToTradingBlock", {
										dpids: [p.draft.dpid],
									});
								}}
							>
								Trade away pick
							</button>
						) : (
							<button
								className="btn btn-xs btn-light-bordered ms-2"
								disabled={drafting}
								onClick={async () => {
									await toWorker("actions", "tradeFor", {
										dpid: p.draft.dpid,
										tid: p.draft.tid,
									});
								}}
							>
								Trade for pick
							</button>
						)
					) : null}
				</>
			),
			isDraftedPlayer(p) ? p.ratings.pos : null,
			isDraftedPlayer(p) ? p.age : null,
			isDraftedPlayer(p) && !challengeNoRatings ? p.ratings.ovr : null,
			isDraftedPlayer(p) && !challengeNoRatings ? p.ratings.pot : null,
		];

		if (fantasyDraft || expansionDraft) {
			data.splice(
				7,
				0,
				...(isDraftedPlayer(p)
					? [wrappedContractAmount(p), p.contract.exp]
					: [null, null]),
				...stats.map((stat) => {
					// stats can be undefined for drafted players with no stats this season
					const value = isDraftedPlayer(p)
						? getNumericStat(p.stats?.[stat])
						: undefined;
					return value !== undefined ? helpers.roundStat(value, stat) : null;
				}),
			);
		}

		if (expansionDraft) {
			data.splice(
				2,
				0,
				<a href={helpers.leagueUrl(["roster", `${prevAbbrev}_${prevTid}`])}>
					{prevAbbrev}
				</a>,
			);
		}

		return {
			// Drafted players may not have a dpid
			key: p.draft.dpid ?? `pid-${p.pid}`,
			metadata: isDraftedPlayer(p)
				? {
						type: "player",
						pid: p.pid,
						season,
						playoffs: "regularSeason",
					}
				: undefined,
			data,
			classNames: {
				"table-info":
					userTids.includes(p.draft.tid) ||
					(prevTid !== undefined && userTids.includes(prevTid)),
			},
		};
	});
	const buttonClasses = clsx("btn", "btn-primary", "btn-xs", {
		"d-sm-none": !(fantasyDraft || expansionDraft),
		"d-xl-none": fantasyDraft || expansionDraft,
	});
	const wrapperClasses = clsx("row");
	const colClass =
		fantasyDraft || expansionDraft ? "col-12 col-xl-6" : "col-sm-6";
	const undraftedColClasses = clsx(colClass);
	const draftedColClasses = clsx(colClass);

	const messages = [];
	if (remainingPicks.length > 0) {
		if (challengeNoDraftPicks && !fantasyDraft && !expansionDraft) {
			messages.push(
				<div>
					<p className="alert alert-danger d-inline-block">
						<b>Challenge Mode:</b> Your team does not get any draft picks unless
						you acquire them in a trade.
					</p>
				</div>,
			);
		}
		if (spectator) {
			messages.push(
				<div>
					<p className="alert alert-danger d-inline-block">
						In spectator mode you can't make draft picks, you can only watch the
						draft.
					</p>
				</div>,
			);
		}
		if (expansionDraftFilteredTeamsMessage) {
			messages.push(
				<div>
					<p className="alert alert-warning d-inline-block">
						{expansionDraftFilteredTeamsMessage}
					</p>
				</div>,
			);
		}
		if (godMode) {
			messages.push(
				<div className="mb-3">
					<button
						className="btn btn-god-mode"
						onClick={() => {
							setEditDraftOrder((value) => !value);
						}}
					>
						{editDraftOrder ? "Done editing order" : "Edit draft order"}
					</button>
				</div>,
			);
		}
	} else {
		messages.push(
			<p>
				<span className="alert alert-success d-inline-block mb-0">
					The draft is over!
				</span>
			</p>,
		);
		if (fantasyDraft || expansionDraft) {
			messages.push(
				<p>
					<span className="alert alert-warning d-inline-block mb-0">
						Draft results from {fantasyDraft ? "fantasy" : "expansion"} drafts
						are only temporarily viewable. When you navigate away from this page
						or proceed to the next phase of the game, you cannot come back to
						this page.
					</span>
				</p>,
			);
		}
	}

	return (
		<>
			<MoreLinks type="draft" page="draft" draftType={draftType} />
			<StickyDraftInfo
				challengeNoRatings={challengeNoRatings}
				drafted={draftedSorted}
				season={season}
				spectator={spectator}
				userNextPickYear={userNextPickYear}
				userTids={userTids}
			/>
			<div className="d-sm-flex gap-3">
				{messages.length > 0 ? (
					<div>
						{messages.map((message, i) => (
							<Fragment key={i}>{message}</Fragment>
						))}
					</div>
				) : null}

				<RosterComposition className="mb-3" players={userPlayers} />
			</div>

			{undrafted.length > 1 ? (
				<div className="mb-3">
					<a
						href={helpers.leagueUrl([
							"compare_players",
							undrafted
								.slice(0, 5)
								.map((p) => `${p.pid}-${season}-r`)
								.join(","),
						])}
					>
						Compare top {Math.min(5, undrafted.length)} remaining{" "}
						{helpers.plural("prospect", undrafted.length)}
					</a>
				</div>
			) : null}

			<div className={wrapperClasses}>
				<div
					className={undraftedColClasses}
					id="table-undrafted"
					style={{
						scrollMarginTop: DRAFT_BAR_HEIGHT,
					}}
				>
					<h2>
						Undrafted Players
						<span className="float-end">
							<button
								type="button"
								className={buttonClasses}
								onClick={() => {
									const target = document.getElementById("table-draft-results");
									if (target) {
										target.scrollIntoView(true);
									}
								}}
							>
								View Drafted
							</button>
						</span>
					</h2>

					<DataTable
						cols={colsUndrafted}
						defaultSort={[0, "asc"]}
						defaultStickyCols={window.mobile ? 1 : 2}
						name="Draft:Undrafted"
						pagination={rowsDrafted.length > 100}
						rows={rowsUndrafted}
					/>
				</div>
				<div
					className={draftedColClasses}
					id="table-draft-results"
					style={{
						scrollMarginTop: DRAFT_BAR_HEIGHT,
					}}
				>
					<h2>
						Draft Results
						<span className="float-end">
							<button
								type="button"
								className={buttonClasses}
								onClick={() => {
									const target = document.getElementById("table-undrafted");
									if (target) {
										target.scrollIntoView(true);
									}
								}}
							>
								View Undrafted
							</button>
						</span>
					</h2>

					<DataTable
						cols={colsDrafted}
						defaultSort={sortableRows ? "disableSort" : [0, "asc"]}
						defaultStickyCols={window.mobile ? 1 : 2}
						hideAllControls={sortableRows}
						name="Draft:Drafted"
						pagination={sortableRows ? false : rowsDrafted.length > 100}
						rows={rowsDrafted}
						sortableRows={
							sortableRows
								? {
										disableRow: (index) => {
											const row = draftedSorted[index];
											return row !== undefined && isDraftedPlayer(row);
										},
										onChange: async ({ oldIndex, newIndex }) => {
											if (oldIndex === newIndex) {
												return;
											}
											const numDraftedPlayers =
												draftedSorted.length - remainingPicks.length;
											const dpids = remainingPicks.map((row) => row.draft.dpid);
											const newSortedDpids = arrayMove(
												dpids,
												oldIndex - numDraftedPlayers,
												newIndex - numDraftedPlayers,
											);
											setSortedDpids(newSortedDpids);
											await toWorker(
												"main",
												"reorderDraftDrag",
												newSortedDpids,
											);
										},
										onSwap: async (index1, index2) => {
											const numDraftedPlayers =
												draftedSorted.length - remainingPicks.length;
											const i1 = index1 - numDraftedPlayers;
											const i2 = index2 - numDraftedPlayers;
											const pick1 = remainingPicks[i1];
											const pick2 = remainingPicks[i2];
											if (!pick1 || !pick2) {
												return;
											}
											const newSortedDpids = remainingPicks.map(
												(row) => row.draft.dpid,
											);
											newSortedDpids[i1] = pick2.draft.dpid;
											newSortedDpids[i2] = pick1.draft.dpid;
											setSortedDpids(newSortedDpids);
											await toWorker(
												"main",
												"reorderDraftDrag",
												newSortedDpids,
											);
										},
									}
								: undefined
						}
					/>
				</div>
			</div>
		</>
	);
};

export default Draft;
