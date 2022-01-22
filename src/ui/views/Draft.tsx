import classNames from "classnames";
import { useState } from "react";
import useTitleBar from "../hooks/useTitleBar";
import { confirm, getCols, helpers, toWorker, useLocal } from "../util";
import {
	DataTable,
	DraftAbbrev,
	MoreLinks,
	PlayerNameLabels,
	RosterComposition,
} from "../components";
import type { View } from "../../common/types";

const DraftButtons = ({
	spectator,
	userRemaining,
	usersTurn,
}: {
	spectator: boolean;
	userRemaining: boolean;
	usersTurn: boolean;
}) => {
	return (
		<div className="btn-group mb-3" id="draft-buttons">
			<button
				className="btn btn-light-bordered"
				disabled={usersTurn && !spectator}
				onClick={async () => {
					await toWorker("playMenu", "onePick", undefined);
				}}
			>
				Sim one pick
			</button>
			{userRemaining ? (
				<button
					className="btn btn-light-bordered"
					disabled={usersTurn && !spectator}
					onClick={async () => {
						await toWorker("playMenu", "untilYourNextPick", undefined);
					}}
				>
					To your next pick
				</button>
			) : null}
			<button
				className="btn btn-light-bordered"
				onClick={async () => {
					if (userRemaining && !spectator) {
						const result = await confirm(
							"If you proceed, the AI will make your remaining picks for you. Are you sure?",
							{
								okText: "Let AI finish the draft",
								cancelText: "Cancel",
							},
						);

						if (!result) {
							return;
						}
					}
					await toWorker("playMenu", "untilEnd", undefined);
				}}
			>
				To end of draft
			</button>
		</div>
	);
};

const Draft = ({
	challengeNoDraftPicks,
	challengeNoRatings,
	draftType,
	drafted,
	expansionDraft,
	expansionDraftFilteredTeamsMessage,
	fantasyDraft,
	spectator,
	stats,
	undrafted,
	userPlayers,
	userTids,
}: View<"draft">) => {
	const [drafting, setDrafting] = useState(false);

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
	const remainingPicks = drafted.filter(p => p.pid < 0);
	const nextPick = remainingPicks[0];
	const usersTurn = !!(nextPick && userTids.includes(nextPick.draft.tid));
	const userRemaining = remainingPicks.some(p =>
		userTids.includes(p.draft.tid),
	);
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
			...getCols(["Contract", "Exp", ...stats.map(stat => `stat:${stat}`)]),
		);
	}

	if (expansionDraft) {
		colsUndrafted.splice(3, 0, ...getCols(["Team"]));
	}

	const rowsUndrafted = undrafted.map(p => {
		const data = [
			p.rank,
			<PlayerNameLabels
				pid={p.pid}
				injury={p.injury}
				skills={p.ratings.skills}
				watch={p.watch}
			>
				{p.name}
			</PlayerNameLabels>,
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
				helpers.formatCurrency(p.contract.amount, "M"),
				p.contract.exp,
				...stats.map(stat =>
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
			data,
		};
	});

	const colsDrafted = getCols(["Pick", "Team"]).concat(
		colsUndrafted.slice(1, -1),
	);

	if (expansionDraft) {
		colsDrafted.splice(4, 1);
		colsDrafted.splice(2, 0, getCols(["From"])[0]);
	}

	const teamInfoCache = useLocal(state => state.teamInfoCache);

	const rowsDrafted = drafted.map((p, i) => {
		const data = [
			`${p.draft.round}-${p.draft.pick}`,
			{
				searchValue: `${teamInfoCache[p.draft.tid]?.abbrev} ${
					teamInfoCache[p.draft.originalTid]?.abbrev
				}`,
				sortValue: `${p.draft.tid} ${p.draft.originalTid}`,
				value: (
					<DraftAbbrev originalTid={p.draft.originalTid} tid={p.draft.tid} />
				),
			},
			p.pid >= 0 ? (
				<PlayerNameLabels
					pid={p.pid}
					injury={p.injury}
					skills={p.ratings.skills}
					watch={p.watch}
				>
					{p.name}
				</PlayerNameLabels>
			) : (
				<>
					<button
						className="btn btn-xs btn-light-bordered"
						disabled={drafting}
						onClick={async () => {
							if (!spectator) {
								let numUserPicksBefore = 0;
								for (const p2 of drafted) {
									if (p2.draft.dpid === p.draft.dpid) {
										break;
									}

									if (userTids.includes(p2.draft.tid)) {
										numUserPicksBefore += 1;
									}
								}

								if (numUserPicksBefore > 0) {
									const multipleTeams = userTids.length > 1;
									const multiplePicks = numUserPicksBefore > 1;

									const proceed = await confirm(
										`Your team${multipleTeams ? "s" : ""} control${
											multipleTeams ? "" : "s"
										} ${numUserPicksBefore} pick${
											multiplePicks ? "s" : ""
										} before this one. The AI will make ${
											multiplePicks ? "those draft picks" : "that draft pick"
										} for you if you choose to sim to this pick.`,
										{
											okText: `Let AI Make My Pick${multiplePicks ? "s" : ""}`,
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
					{!fantasyDraft &&
					!expansionDraft &&
					!userTids.includes(p.draft.tid) &&
					!spectator ? (
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
					? [helpers.formatCurrency(p.contract.amount, "M"), p.contract.exp]
					: [null, null]),
				...stats.map(stat =>
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
			key: i,
			data,
			classNames: {
				"table-info":
					userTids.includes(p.draft.tid) || userTids.includes(p.prevTid),
			},
		};
	});
	const buttonClasses = classNames("btn", "btn-primary", "btn-xs", {
		"d-sm-none": !(fantasyDraft || expansionDraft),
		"d-xl-none": fantasyDraft || expansionDraft,
	});
	const wrapperClasses = classNames("row");
	const colClass =
		fantasyDraft || expansionDraft ? "col-12 col-xl-6" : "col-sm-6";
	const undraftedColClasses = classNames(colClass);
	const draftedColClasses = classNames(colClass);
	return (
		<>
			<div className="d-sm-flex">
				<div>
					<MoreLinks type="draft" page="draft" draftType={draftType} />

					{remainingPicks.length > 0 ? (
						<>
							{challengeNoDraftPicks && !fantasyDraft && !expansionDraft ? (
								<div>
									<p className="alert alert-danger d-inline-block">
										<b>Challenge Mode:</b> Your team does not get any draft
										picks unless you acquire them in a trade.
									</p>
								</div>
							) : null}
							{spectator ? (
								<div>
									<p className="alert alert-danger d-inline-block">
										In spectator mode you can't make draft picks, you can only
										watch the draft.
									</p>
								</div>
							) : null}
							{expansionDraftFilteredTeamsMessage ? (
								<div>
									<p className="alert alert-warning d-inline-block">
										{expansionDraftFilteredTeamsMessage}
									</p>
								</div>
							) : null}
							<DraftButtons
								spectator={spectator}
								userRemaining={userRemaining}
								usersTurn={usersTurn}
							/>
						</>
					) : (
						<>
							<p id="draft-buttons">
								<span className="alert alert-success d-inline-block mb-0">
									The draft is over!
								</span>
							</p>
							{fantasyDraft || expansionDraft ? (
								<p>
									<span className="alert alert-warning d-inline-block mb-0">
										Draft results from {fantasyDraft ? "fantasy" : "expansion"}{" "}
										drafts are only temporarily viewable. When you navigate away
										from this page or proceed to the next phase of the game, you
										cannot come back to this page.
									</span>
								</p>
							) : null}
						</>
					)}
				</div>

				<RosterComposition className="mb-3 ms-sm-3" players={userPlayers} />
			</div>

			<div className={wrapperClasses}>
				<div className={undraftedColClasses}>
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
										window.scrollBy(0, -60);
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
									const target = document.getElementById("draft-buttons");
									if (target) {
										target.scrollIntoView(true);

										// Fixed navbar
										window.scrollBy(0, -60);
									}
								}}
							>
								View Undrafted
							</button>
						</span>
					</h2>

					<DataTable
						cols={colsDrafted}
						defaultSort={[0, "asc"]}
						name="Draft:Drafted"
						pagination={rowsDrafted.length > 100}
						rows={rowsDrafted}
					/>
				</div>
			</div>
		</>
	);
};

export default Draft;
