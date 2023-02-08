import { useState, ReactNode } from "react";
import { PHASE } from "../../common";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers, toWorker } from "../util";
import { ActionButton, DataTable, HelpPopover, SafeHtml } from "../components";
import type { View } from "../../common/types";
import type api from "../../worker/api";
import classNames from "classnames";
import {
	wrappedContractAmount,
	wrappedContractExp,
} from "../components/contract";
import { wrappedPlayerNameLabels } from "../components/PlayerNameLabels";
import { OvrChange } from "./Trade/Summary";

type OfferType = Awaited<
	ReturnType<(typeof api)["main"]["getTradingBlockOffers"]>
>[0];

type OfferProps = {
	children: ReactNode;
	onNegotiate: () => void;
	onRemove: () => void;
} & Omit<OfferType, "pids" | "dpids" | "picks" | "players"> &
	Pick<
		View<"tradingBlock">,
		"challengeNoRatings" | "salaryCap" | "salaryCapType" | "stats"
	>;

const OfferPlayers = ({
	className,
	challengeNoRatings,
	players,
	stats,
}: Pick<OfferType, "players"> & {
	className?: string;
	challengeNoRatings: View<"tradingBlock">["challengeNoRatings"];
	stats: View<"tradingBlock">["stats"];
}) => {
	if (players.length > 0) {
		const cols = getCols(
			[
				"Name",
				"Pos",
				"Age",
				"Ovr",
				"Pot",
				"Contract",
				"Exp",
				...stats.map(stat => `stat:${stat}`),
			],
			{
				Name: {
					width: "100%",
				},
			},
		);

		const rows = players.map(p => {
			return {
				key: p.pid,
				data: [
					wrappedPlayerNameLabels({
						pid: p.pid,
						injury: p.injury,
						jerseyNumber: p.jerseyNumber,
						skills: p.ratings.skills,
						firstName: p.firstName,
						firstNameShort: p.firstNameShort,
						lastName: p.lastName,
					}),
					p.ratings.pos,
					p.age,
					!challengeNoRatings ? p.ratings.ovr : null,
					!challengeNoRatings ? p.ratings.pot : null,
					wrappedContractAmount(p),
					wrappedContractExp(p),
					...stats.map(stat => helpers.roundStat(p.stats[stat], stat)),
				],
			};
		});

		return (
			<DataTable
				classNameWrapper={className}
				cols={cols}
				defaultSort={[5, "desc"]}
				defaultStickyCols={window.mobile ? 0 : 1}
				hideAllControls
				hideMenuToo
				name="TradingBlockOffer"
				rows={rows}
			/>
		);
	}

	return null;
};

const Offer = (props: OfferProps) => {
	const {
		abbrev,
		challengeNoRatings,
		children,
		name,
		onNegotiate,
		onRemove,
		ovrAfter,
		ovrBefore,
		ovrAfterUser,
		ovrBeforeUser,
		payroll,
		region,
		salaryCap,
		salaryCapType,
		strategy,
		tid,
		warning,
	} = props;

	const salaryCapOrPayroll =
		salaryCapType === "none" ? payroll : salaryCap - payroll;
	const salaryCapOrPayrollText =
		salaryCapType === "none" ? "payroll" : "cap space";

	return (
		<div className="mt-4" style={{ maxWidth: 1125 }}>
			<div className="d-flex align-items-center mb-2">
				<h2 className="mb-0">
					<a href={helpers.leagueUrl(["roster", `${abbrev}_${tid}`])}>
						{region} {name}
					</a>
				</h2>
				<button
					type="button"
					className="btn-close ms-1"
					title="Remove offer from list"
					onClick={onRemove}
				/>
			</div>
			<div
				className="mb-3 d-sm-flex justify-content-between"
				style={{ maxWidth: 500 }}
			>
				<div>
					{helpers.formatRecord(props)}, {strategy},{" "}
					{helpers.formatCurrency(salaryCapOrPayroll / 1000, "M")}{" "}
					{salaryCapOrPayrollText}
				</div>
				{!challengeNoRatings ? (
					<>
						<div>
							{abbrev} ovr: <OvrChange before={ovrBefore} after={ovrAfter} />
						</div>
						<div>
							Your ovr:{" "}
							<OvrChange before={ovrBeforeUser} after={ovrAfterUser} />
						</div>
					</>
				) : null}
			</div>
			{children}
			{warning ? <p className="text-danger">{warning}</p> : null}

			<button
				type="submit"
				className="btn btn-light-bordered mb-4"
				onClick={onNegotiate}
			>
				Negotiate
			</button>
		</div>
	);
};

const pickCols = getCols(["", "Draft Picks"], {
	"": {
		sortSequence: [],
	},
	"Draft Picks": {
		width: "100%",
	},
});

const pickScore = (
	picks: {
		round: number;
		pick: number;
	}[],
) => {
	let score = 0;
	for (const { round, pick } of picks) {
		// Assume roughly 30 teams
		const imputedPick = pick > 0 ? pick : 15;

		// Assume no more than 50 rounds or 100 teams
		score += 50 - round + (1 - imputedPick / 100);
	}
	return score;
};

const playerScore = (
	players: {
		ratings: {
			ovr: number;
			pot: number;
		};
	}[],
) => {
	let score = 0;
	for (const p of players) {
		score = (p.ratings.pot + p.ratings.ovr) ** 2;
	}
	return score;
};

const TradingBlock = (props: View<"tradingBlock">) => {
	const [state, setState] = useState<{
		asking: boolean;
		offers: OfferType[];
		pids: number[];
		dpids: number[];
	}>({
		asking: false,
		offers: [],
		pids: props.initialPid !== undefined ? [props.initialPid] : [],
		dpids: props.initialDpid !== undefined ? [props.initialDpid] : [],
	});

	const handleChangeAsset = (type: "pids" | "dpids", id: number) => {
		setState(prevState => {
			const ids = {
				pids: helpers.deepCopy(prevState.pids),
				dpids: helpers.deepCopy(prevState.dpids),
			};

			if (ids[type].includes(id)) {
				ids[type] = ids[type].filter(currId => currId !== id);
			} else {
				ids[type].push(id);
			}

			return {
				...prevState,
				[type]: ids[type],
			};
		});
	};

	const handleClickAsk = async () => {
		setState(prevState => ({
			...prevState,
			asking: true,
			offers: [],
		}));

		const offers = await toWorker("main", "getTradingBlockOffers", {
			pids: state.pids,
			dpids: state.dpids,
		});

		setState(prevState => ({
			...prevState,
			asking: false,
			offers,
		}));
	};

	const handleClickNegotiate = async (
		tid: number,
		otherPids: number[],
		otherDpids: number[],
	) => {
		await toWorker("actions", "tradeFor", {
			otherDpids,
			otherPids,
			tid,
			userDpids: state.dpids,
			userPids: state.pids,
		});
	};

	const handleRemove = (i: number) => {
		setState(prevState => ({
			...prevState,
			offers: prevState.offers.filter((offer, j) => j !== i),
		}));
	};

	const {
		challengeNoRatings,
		challengeNoTrades,
		gameOver,
		phase,
		salaryCap,
		salaryCapType,
		spectator,
		stats,
		userPicks,
		userRoster,
	} = props;

	useTitleBar({ title: "Trading Block" });

	if (spectator) {
		return <p>You're not allowed to make trades in spectator mode.</p>;
	}

	if (challengeNoTrades) {
		return (
			<div>
				<p className="alert alert-danger d-inline-block">
					<b>Challenge Mode:</b> You're not allowed to make trades.
				</p>
			</div>
		);
	}

	if (
		(phase >= PHASE.AFTER_TRADE_DEADLINE && phase <= PHASE.PLAYOFFS) ||
		phase === PHASE.FANTASY_DRAFT ||
		gameOver
	) {
		return (
			<div>
				<h2>Error</h2>
				<p>
					You're not allowed to make trades{" "}
					{phase === PHASE.AFTER_TRADE_DEADLINE
						? "after the trade deadline"
						: "now"}
					.
				</p>
			</div>
		);
	}

	const cols = getCols(
		[
			"",
			"Name",
			"Pos",
			"Age",
			"Ovr",
			"Pot",
			"Contract",
			"Exp",
			...stats.map(stat => `stat:${stat}`),
		],
		{
			"": {
				noSearch: true,
				sortSequence: [],
				width: "1%",
			},
		},
	);

	const rows = userRoster.map(p => {
		return {
			key: p.pid,
			data: [
				<input
					className="form-check-input"
					type="checkbox"
					checked={state.pids.includes(p.pid)}
					disabled={p.untradable}
					onChange={() => handleChangeAsset("pids", p.pid)}
					title={p.untradableMsg}
				/>,
				wrappedPlayerNameLabels({
					pid: p.pid,
					injury: p.injury,
					jerseyNumber: p.jerseyNumber,
					skills: p.ratings.skills,
					watch: p.watch,
					firstName: p.firstName,
					firstNameShort: p.firstNameShort,
					lastName: p.lastName,
				}),
				p.ratings.pos,
				p.age,
				!challengeNoRatings ? p.ratings.ovr : null,
				!challengeNoRatings ? p.ratings.pot : null,
				wrappedContractAmount(p),
				wrappedContractExp(p),
				...stats.map(stat => helpers.roundStat(p.stats[stat], stat)),
			],
		};
	});

	const pickRows = userPicks.map((pick, i) => {
		return {
			key: pick.dpid,
			data: [
				<input
					className="form-check-input"
					type="checkbox"
					checked={state.dpids.includes(pick.dpid)}
					onChange={() => handleChangeAsset("dpids", pick.dpid)}
				/>,
				{
					value: <SafeHtml dirty={pick.desc} />,
					searchValue: pick.desc,
					sortValue: i,
				},
			],
		};
	});

	const offerCols = getCols(
		[
			"Team",
			"Record",
			"Strategy",
			"Ovr",
			"Ovr",
			salaryCapType === "none" ? "Payroll" : "Cap Space",
			"Players",
			"Draft Picks",
			"Cap",
			"Actions",
		],
		{
			Actions: {
				sortSequence: [],
				width: "1px",
			},
			"Draft Picks": {
				sortSequence: ["desc", "asc"],
				sortType: "number",
			},
			Players: {
				sortSequence: ["desc", "asc"],
				sortType: "number",
			},
		},
	);
	offerCols[3].title = "Other Ovr";
	offerCols[3].desc = "Other team's change in ovr rating";
	offerCols[4].title = "Your Ovr";
	offerCols[3].desc = "Your team's change in ovr rating";

	const offerRows = state.offers.map((offer, i) => {
		const salaryCapOrPayroll =
			salaryCapType === "none" ? offer.payroll : salaryCap - offer.payroll;

		return {
			key: offer.tid,
			data: [
				<a href={helpers.leagueUrl(["roster", `${offer.abbrev}_${offer.tid}`])}>
					{offer.abbrev}
				</a>,
				helpers.formatRecord(offer),
				offer.strategy,
				!challengeNoRatings
					? {
							value: (
								<OvrChange before={offer.ovrBefore} after={offer.ovrAfter} />
							),
							sortValue: offer.ovrAfter,
							searchValue: `${offer.ovrBefore} ${offer.ovrAfter}`,
					  }
					: null,
				!challengeNoRatings
					? {
							value: (
								<OvrChange
									before={offer.ovrBeforeUser}
									after={offer.ovrAfterUser}
								/>
							),
							sortValue: offer.ovrAfterUser,
							searchValue: `${offer.ovrBeforeUser} ${offer.ovrAfterUser}`,
					  }
					: null,
				helpers.formatCurrency(salaryCapOrPayroll / 1000, "M"),
				{
					value: (
						<OfferPlayers
							className="mb-0"
							challengeNoRatings={challengeNoRatings}
							players={offer.players}
							stats={stats}
						/>
					),
					searchValue: offer.players
						.map(p => `${p.name} ${p.ratings.pos}`)
						.join(" "),
					sortValue: playerScore(offer.players),
				},
				{
					value: (
						<ul className="list-unstyled mb-0">
							{offer.picks.map(pick => (
								<li key={pick.dpid}>
									<SafeHtml dirty={pick.desc} />
								</li>
							))}
						</ul>
					),
					searchValue: offer.picks.map(pick => pick.desc).join(" "),
					sortValue: pickScore(offer.picks),
				},
				{
					value: offer.warning ? (
						<HelpPopover className="fs-4">{offer.warning}</HelpPopover>
					) : null,
					sortValue: offer.warningAmount ?? 0,
					classNames: classNames(
						"text-center",
						offer.warning ? "table-danger" : undefined,
					),
				},
				<div className="d-flex align-items-center">
					<button
						type="submit"
						className="btn btn-light-bordered"
						onClick={() =>
							handleClickNegotiate(offer.tid, offer.pids, offer.dpids)
						}
					>
						Negotiate
					</button>
					<button
						type="button"
						className="btn-close ms-2 p-0"
						title="Remove offer from list"
						onClick={() => {
							handleRemove(i);
						}}
					/>
				</div>,
			],
		};
	});

	return (
		<>
			<p>
				Select some assets you want to trade away and other teams will make you
				trade offers.
			</p>

			<div className="row mb-3">
				<div className="col-md-9">
					<DataTable
						cols={cols}
						defaultSort={[6, "desc"]}
						defaultStickyCols={window.mobile ? 1 : 2}
						name="TradingBlock"
						rows={rows}
					/>
				</div>
				<div className="col-md-3 pt-3">
					<DataTable
						cols={pickCols}
						defaultSort={[1, "asc"]}
						hideAllControls
						name={`TradingBlock:Picks`}
						rows={pickRows}
					/>
				</div>
			</div>

			<div className="text-center">
				<ActionButton
					processing={state.asking}
					onClick={handleClickAsk}
					size="lg"
					variant="primary"
				>
					Ask For Trade Proposals
				</ActionButton>
			</div>

			<div className="d-none d-xxl-block">
				{offerRows.length > 0 ? (
					<DataTable
						className="align-top-all"
						clickable={false}
						cols={offerCols}
						defaultSort={[0, "asc"]}
						name={`TradingBlock:Offers`}
						rows={offerRows}
						small={false}
					/>
				) : null}
			</div>

			<div className="d-block d-xxl-none">
				{state.offers.map((offer, i) => {
					return (
						<Offer
							key={offer.tid}
							challengeNoRatings={challengeNoRatings}
							onNegotiate={() => {
								handleClickNegotiate(offer.tid, offer.pids, offer.dpids);
							}}
							onRemove={() => {
								handleRemove(i);
							}}
							salaryCap={salaryCap}
							salaryCapType={salaryCapType}
							stats={stats}
							{...offer}
						>
							{offer.picks.length > 0 || offer.players.length > 0 ? (
								<div className="row">
									{offer.players.length > 0 ? (
										<div className="col-md-8">
											<OfferPlayers
												challengeNoRatings={challengeNoRatings}
												players={offer.players}
												stats={stats}
											/>
										</div>
									) : null}
									{offer.picks.length > 0 ? (
										<div className="col-md-4">
											<table className="table table-striped table-borderless table-sm">
												<thead>
													<tr>
														<th>Draft Picks</th>
													</tr>
												</thead>
												<tbody>
													{offer.picks.map(pick => (
														<tr key={pick.dpid}>
															<td>
																<SafeHtml dirty={pick.desc} />
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									) : null}
								</div>
							) : (
								<p>Nothing.</p>
							)}
						</Offer>
					);
				})}
			</div>
		</>
	);
};

export default TradingBlock;
