import clsx from "clsx";
import { Fragment, useState } from "react";
import useTitleBar from "../../hooks/useTitleBar.tsx";
import {
	confirm,
	getCol,
	getCols,
	helpers,
	toWorker,
	useLocal,
} from "../../util/index.ts";
import {
	DataTable,
	MoreLinks,
	RosterComposition,
} from "../../components/index.tsx";
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

const Draft = ({
	challengeNoDraftPicks,
	challengeNoRatings,
	draftType,
	drafted,
	expansionDraft,
	expansionDraftFilteredTeamsMessage,
	fantasyDraft,
	godMode,
	season,
	spectator,
	stats,
	teamsByTid,
	undrafted,
	userNextPickYear,
	userPlayers,
	userTid,
	userTids,
}: View<"draft">) => {
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
	let draftedSorted: typeof drafted;
	if (sortedDpids !== undefined) {
		const draftedByDpid = groupByUnique(drafted, (p) => p.draft.dpid);
		const draftedPlayers = drafted.filter((p) => p.pid >= 0);
		const dpids = drafted.map((row) => row.draft.dpid);
		draftedSorted = [
			// Drafted players always at top
			...draftedPlayers,

			// Then draft picks follow
			...sortedDpids.map((dpid, i) => {
				const unsortedDpid = dpids[i + draftedPlayers.length];
				const dpToTakeOrderFrom = draftedByDpid[unsortedDpid].draft;

				return {
					...draftedByDpid[dpid],
					draft: {
						...draftedByDpid[dpid].draft,

						// Need to manually update round/pick for instant feedback rather than waiting for the server to update, because otherwise all this sortedDpids stuff is useless because the sort of the DataTable overrides it
						round: dpToTakeOrderFrom.round,
						pick: dpToTakeOrderFrom.pick,
					},
				};
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
	const remainingPicks = draftedSorted.filter((p) => p.pid < 0);
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

	const rowsUndrafted: DataTableRow[] = undrafted.map((p) => {
		const data = [
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
				...stats.map((stat) =>
					p.pid >= 0 && p.stats && typeof p.stats[stat] === "number"
						? helpers.roundStat(p.stats[stat], stat)
						: p.stats[stat],
				),
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

	const teamInfoCache = useLocal((state) => state.teamInfoCache);

	const rowsDrafted: DataTableRow[] = draftedSorted.map((p, i) => {
		const data = [
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
			p.pid >= 0 ? (
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
			p.pid >= 0 ? p.ratings.pos : null,
			p.pid >= 0 ? p.age : null,
			p.pid >= 0 && !challengeNoRatings ? p.ratings.ovr : null,
			p.pid >= 0 && !challengeNoRatings ? p.ratings.pot : null,
		];

		if (fantasyDraft || expansionDraft) {
			data.splice(
				7,
				0,
				...(p.pid >= 0
					? [wrappedContractAmount(p), p.contract.exp]
					: [null, null]),
				...stats.map((stat) =>
					p.pid >= 0 && p.stats && typeof p.stats[stat] === "number"
						? helpers.roundStat(p.stats[stat], stat)
						: null,
				),
			);
		}

		if (expansionDraft) {
			data.splice(
				2,
				0,
				<a href={helpers.leagueUrl(["roster", `${p.prevAbbrev}_${p.prevTid}`])}>
					{p.prevAbbrev}
				</a>,
			);
		}

		return {
			key: p.draft.dpid,
			metadata:
				p.pid >= 0
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
					userTids.includes(p.draft.tid) || userTids.includes(p.prevTid),
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
						Edit draft order
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
				<div className={undraftedColClasses} id="table-undrafted">
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

										// Fixed navbar
										window.scrollBy(0, -142);
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
				<div className={draftedColClasses} id="table-draft-results">
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

										// Fixed navbar
										window.scrollBy(0, -142);
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
										disableRow: (index) => draftedSorted[index].pid >= 0,
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
											const newSortedDpids = remainingPicks.map(
												(row) => row.draft.dpid,
											);
											newSortedDpids[i1] = remainingPicks[i2].draft.dpid;
											newSortedDpids[i2] = remainingPicks[i1].draft.dpid;
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
