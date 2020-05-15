import classNames from "classnames";
import PropTypes from "prop-types";
import React, { useState } from "react";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers, toWorker } from "../util";
import { DataTable, DraftAbbrev, PlayerNameLabels } from "../components";
import type { View } from "../../common/types";

const DraftButtons = ({
	userRemaining,
	usersTurn,
}: {
	userRemaining: boolean;
	usersTurn: boolean;
}) => {
	const untilText = userRemaining ? "your next pick" : "end of draft";
	return (
		<div className="btn-group mb-3">
			<button
				className="btn btn-light-bordered"
				disabled={usersTurn}
				onClick={async () => {
					await toWorker("playMenu", "onePick");
				}}
			>
				Sim one pick
			</button>
			<button
				className="btn btn-light-bordered"
				disabled={usersTurn}
				onClick={async () => {
					await toWorker("playMenu", "untilYourNextPick");
				}}
			>
				Sim until {untilText}
			</button>
		</div>
	);
};

DraftButtons.propTypes = {
	userRemaining: PropTypes.bool.isRequired,
	usersTurn: PropTypes.bool.isRequired,
};

const TradeButton = ({
	disabled,
	dpid,
	tid,
	visible,
}: {
	disabled: boolean;
	dpid: number;
	tid: number;
	visible: boolean;
}) => {
	return visible ? (
		<button
			className="btn btn-xs btn-light-bordered"
			disabled={disabled}
			onClick={async () => {
				await toWorker("actions", "tradeFor", {
					dpid,
					tid,
				});
			}}
		>
			Trade For Pick
		</button>
	) : null;
};

TradeButton.propTypes = {
	disabled: PropTypes.bool.isRequired,
	dpid: PropTypes.number.isRequired,
	tid: PropTypes.number.isRequired,
	visible: PropTypes.bool.isRequired,
};

const scrollLeft = (pos: number) => {
	// https://blog.hospodarets.com/native_smooth_scrolling
	if ("scrollBehavior" in document.documentElement.style) {
		window.scrollTo({
			left: pos,
			top: document.body.scrollTop,
			behavior: "smooth",
		});
	} else {
		window.scrollTo(pos, document.body.scrollTop);
	}
};

const viewDrafted = () => {
	scrollLeft(document.body.scrollWidth - document.body.clientWidth);
};

const viewUndrafted = () => {
	scrollLeft(0);
};

const Draft = ({
	draftType,
	drafted,
	expansionDraft,
	fantasyDraft,
	stats,
	undrafted,
	userTids,
}: View<"draft">) => {
	const [drafting, setDrafting] = useState(false);

	const draftUser = async (pid: number, simToNextUserPick = false) => {
		setDrafting(true);
		await toWorker("main", "draftUser", pid);
		setDrafting(false);

		if (simToNextUserPick) {
			await toWorker("playMenu", "untilYourNextPick");
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
	const colsUndrafted = getCols("Name", "Pos", "Age", "Ovr", "Pot", "Draft");
	colsUndrafted[0].width = "100%";

	if (fantasyDraft || expansionDraft) {
		colsUndrafted.splice(
			5,
			0,
			...getCols("Contract", ...stats.map(stat => `stat:${stat}`)),
		);
	}

	if (expansionDraft) {
		colsUndrafted.splice(2, 0, ...getCols("Team"));
	}

	const rowsUndrafted = undrafted.map(p => {
		const data = [
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
			p.ratings.ovr,
			p.ratings.pot,
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
					And Sim
				</button>
			</div>,
		];

		if (fantasyDraft || expansionDraft) {
			data.splice(
				5,
				0,
				`${helpers.formatCurrency(p.contract.amount, "M")} thru ${
					p.contract.exp
				}`,
				...stats.map(stat =>
					p.pid >= 0 && p.stats && typeof p.stats[stat] === "number"
						? helpers.roundStat(p.stats[stat], stat)
						: p.stats[stat],
				),
			);
		}

		if (expansionDraft) {
			data.splice(
				2,
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

	const colsDrafted = getCols("Pick", "Team").concat(
		colsUndrafted.slice(0, -1),
	);

	if (expansionDraft) {
		colsDrafted.splice(4, 1);
		colsDrafted.splice(2, 0, getCols("From")[0]);
	}

	const rowsDrafted = drafted.map((p, i) => {
		const data = [
			`${p.draft.round}-${p.draft.pick}`,
			{
				sortValue: `{p.draft.tid} {p.draft.originalTid}`,
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
				<TradeButton
					dpid={p.draft.dpid}
					disabled={drafting}
					tid={p.draft.tid}
					visible={
						!fantasyDraft && !expansionDraft && !userTids.includes(p.draft.tid)
					}
				/>
			),
			p.pid >= 0 ? p.ratings.pos : null,
			p.pid >= 0 ? p.age : null,
			p.pid >= 0 ? p.ratings.ovr : null,
			p.pid >= 0 ? p.ratings.pot : null,
		];

		if (fantasyDraft || expansionDraft) {
			data.splice(
				7,
				0,
				p.pid >= 0
					? `${helpers.formatCurrency(p.contract.amount, "M")} thru ${
							p.contract.exp
					  }`
					: null,
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
	const wrapperClasses = classNames(
		"row",
		"row-offcanvas",
		"row-offcanvas-right",
		{
			"row-offcanvas-force": fantasyDraft || expansionDraft,
			"row-offcanvas-right-force": fantasyDraft || expansionDraft,
		},
	);
	const colClass =
		fantasyDraft || expansionDraft ? "col-12 col-xl-6" : "col-sm-6";
	const undraftedColClasses = classNames(colClass);
	const draftedColClasses = classNames("sidebar-offcanvas", colClass, {
		"sidebar-offcanvas-force": fantasyDraft || expansionDraft,
	});
	return (
		<>
			<p>
				More:{" "}
				<a href={helpers.leagueUrl(["draft_scouting"])}>
					Future Draft Scouting
				</a>{" "}
				| <a href={helpers.leagueUrl(["draft_history"])}>Draft History</a> |{" "}
				{draftType !== "noLottery" && draftType !== "random" ? (
					<>
						<a href={helpers.leagueUrl(["draft_lottery"])}>Draft Lottery</a> |{" "}
					</>
				) : null}
				<a href={helpers.leagueUrl(["draft_team_history"])}>Team History</a>
			</p>

			<p>
				When your turn in the draft comes up, select from the list of available
				players on the left.
			</p>

			{remainingPicks.length > 0 ? (
				<DraftButtons userRemaining={userRemaining} usersTurn={usersTurn} />
			) : (
				<>
					<p>
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

			<div className={wrapperClasses}>
				<div className={undraftedColClasses}>
					<h2>
						Undrafted Players
						<span className="float-right">
							<button
								type="button"
								className={buttonClasses}
								onClick={viewDrafted}
							>
								View Drafted
							</button>
						</span>
					</h2>

					<DataTable
						cols={colsUndrafted}
						defaultSort={[4, "desc"]}
						name="Draft:Undrafted"
						pagination={rowsDrafted.length > 100}
						rows={rowsUndrafted}
					/>
				</div>
				<div className={draftedColClasses}>
					<h2>
						Draft Results
						<span className="float-right">
							<button
								type="button"
								className={buttonClasses}
								onClick={viewUndrafted}
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

Draft.propTypes = {
	draftType: PropTypes.oneOf(["nba1994", "nba2019", "noLottery", "random"]),
	drafted: PropTypes.arrayOf(PropTypes.object).isRequired,
	fantasyDraft: PropTypes.bool.isRequired,
	stats: PropTypes.arrayOf(PropTypes.string).isRequired,
	undrafted: PropTypes.arrayOf(PropTypes.object).isRequired,
	userTids: PropTypes.arrayOf(PropTypes.number).isRequired,
};

export default Draft;
