import { useState, type ReactNode } from "react";
import { PHASE } from "../../common";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers, toWorker, useLocalPartial } from "../util";
import { ActionButton, DataTable, HelpPopover, SafeHtml } from "../components";
import type { Col } from "../components/DataTable";
import type { View } from "../../common/types";
import type api from "../../worker/api";
import classNames from "classnames";
import {
	wrappedContractAmount,
	wrappedContractExp,
} from "../components/contract";
import { wrappedPlayerNameLabels } from "../components/PlayerNameLabels";
import { OvrChange } from "./Trade/Summary";

export type OfferType = Awaited<
	ReturnType<(typeof api)["main"]["getTradingBlockOffers"]>
>[0];

type OfferProps = {
	children: ReactNode;
	hideTopTeamOvrs?: boolean;
	onNegotiate: () => void;
	onRemove: () => void;
	teamInfo: {
		abbrev: string;
		name: string;
		region: string;
	};
} & Omit<OfferType, "pids" | "dpids" | "picks" | "players"> &
	Pick<
		View<"tradingBlock">,
		"challengeNoRatings" | "salaryCap" | "salaryCapType"
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

export const Offer = (props: OfferProps) => {
	const {
		challengeNoRatings,
		children,
		hideTopTeamOvrs,
		onNegotiate,
		onRemove,
		payroll,
		salaryCap,
		salaryCapType,
		strategy,
		summary,
		tid,
		teamInfo,
	} = props;

	const salaryCapOrPayroll =
		salaryCapType === "none" ? payroll : salaryCap - payroll;
	const salaryCapOrPayrollText =
		salaryCapType === "none" ? "payroll" : "cap space";

	if (!teamInfo) {
		return null;
	}

	return (
		<div className="mt-4" style={{ maxWidth: 1125 }}>
			<div className="d-flex align-items-center mb-2">
				<h2 className="mb-0">
					<a href={helpers.leagueUrl(["roster", `${teamInfo.abbrev}_${tid}`])}>
						{teamInfo.region} {teamInfo.name}
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
				{!challengeNoRatings && !hideTopTeamOvrs ? (
					<>
						<div>
							Your ovr:{" "}
							<OvrChange
								before={summary.teams[1].ovrBefore}
								after={summary.teams[1].ovrAfter}
							/>
						</div>
						<div>
							{teamInfo.abbrev} ovr:{" "}
							<OvrChange
								before={summary.teams[0].ovrBefore}
								after={summary.teams[0].ovrAfter}
							/>
						</div>
					</>
				) : null}
			</div>
			{children}
			{summary.warning ? (
				<p className="text-danger">{summary.warning}</p>
			) : null}

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

export const pickScore = (
	picks: {
		round: number;
		pick: number;
	}[],
) => {
	let score = 0;
	for (const { round, pick } of picks) {
		// Assume roughly 30 teams
		const imputedPick = pick > 0 ? pick : 15;

		// Assume no more than 20 rounds or 100 teams. Exponent is tuned so that you need about 4 second round picks to equal 1 first round pick.
		score += (20 - round + (1 - imputedPick / 100)) ** 25;
	}
	return score;
};

export const playerScore = (
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

export const OfferTable = ({
	assetCols,
	challengeNoRatings,
	getAssetColContents,
	handleNegotiate,
	handleRemove,
	offers,
	salaryCap,
	salaryCapType,
}: {
	assetCols: Col[];
	getAssetColContents: (offer: OfferType) => any[];
	handleNegotiate: (tradeInfo: {
		tid: number;
		pids: number[];
		pidsUser: number[];
		dpids: number[];
		dpidsUser: number[];
	}) => void;
	handleRemove: (i: number) => void;
	offers: OfferType[];
} & Pick<
	View<"tradingBlock">,
	"challengeNoRatings" | "salaryCap" | "salaryCapType"
>) => {
	const { teamInfoCache } = useLocalPartial(["teamInfoCache"]);

	const offerCols = getCols(
		[
			"Team",
			"Record",
			"Strategy",
			"Ovr",
			"Ovr",
			salaryCapType === "none" ? "Payroll" : "Cap Space",
			"Cap",
			"Actions",
		],
		{
			Actions: {
				sortSequence: [],
				width: "1px",
			},
		},
	);
	offerCols[3].title = "Your Ovr";
	offerCols[3].desc = "Your team's change in ovr rating";
	offerCols[4].title = "Other Ovr";
	offerCols[4].desc = "Other team's change in ovr rating";
	offerCols.splice(5, 0, ...assetCols);

	const offerRows = offers.map((offer, i) => {
		const salaryCapOrPayroll =
			salaryCapType === "none" ? offer.payroll : salaryCap - offer.payroll;

		const t = teamInfoCache[offer.tid];
		if (!t) {
			return {
				key: offer.tid,
				data: [],
			};
		}

		return {
			key: offer.tid,
			data: [
				<a href={helpers.leagueUrl(["roster", `${t.abbrev}_${offer.tid}`])}>
					{t.abbrev}
				</a>,
				helpers.formatRecord(offer),
				offer.strategy,
				!challengeNoRatings
					? {
							value: (
								<OvrChange
									before={offer.summary.teams[1].ovrBefore}
									after={offer.summary.teams[1].ovrAfter}
								/>
							),
							sortValue: offer.summary.teams[1].ovrAfter,
							searchValue: `${offer.summary.teams[1].ovrBefore} ${offer.summary.teams[1].ovrAfter}`,
					  }
					: null,
				!challengeNoRatings
					? {
							value: (
								<OvrChange
									before={offer.summary.teams[0].ovrBefore}
									after={offer.summary.teams[0].ovrAfter}
								/>
							),
							sortValue: offer.summary.teams[0].ovrAfter,
							searchValue: `${offer.summary.teams[0].ovrBefore} ${offer.summary.teams[0].ovrAfter}`,
					  }
					: null,
				...getAssetColContents(offer),
				helpers.formatCurrency(salaryCapOrPayroll / 1000, "M"),
				{
					value: offer.summary.warning ? (
						<HelpPopover className="fs-4">{offer.summary.warning}</HelpPopover>
					) : null,
					sortValue: offer.summary.warningAmount ?? 0,
					classNames: classNames(
						"text-center",
						offer.summary.warning ? "table-danger" : undefined,
					),
				},
				<div className="d-flex align-items-center">
					<button
						type="submit"
						className="btn btn-light-bordered"
						onClick={() => {
							handleNegotiate({
								tid: offer.tid,
								pids: offer.pids,
								pidsUser: offer.pidsUser,
								dpids: offer.dpids,
								dpidsUser: offer.dpidsUser,
							});
						}}
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

	if (offerRows.length === 0) {
		return null;
	}

	return (
		<DataTable
			className="align-top-all"
			clickable={false}
			cols={offerCols}
			defaultSort={[0, "asc"]}
			name={`TradingBlock:Offers`}
			rows={offerRows}
			small={false}
		/>
	);
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

	const handleNegotiate = async (
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

	const { teamInfoCache } = useLocalPartial(["teamInfoCache"]);

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

	return (
		<>
			<p>
				Select some assets you want to trade away and other teams will make you
				trade proposals.
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
				<OfferTable
					assetCols={getCols(["Players", "Draft Picks"], {
						"Draft Picks": {
							sortSequence: ["desc", "asc"],
							sortType: "number",
						},
						Players: {
							sortSequence: ["desc", "asc"],
							sortType: "number",
						},
					})}
					getAssetColContents={offer => {
						return [
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
						];
					}}
					challengeNoRatings={challengeNoRatings}
					handleNegotiate={async tradeInfo => {
						await handleNegotiate(
							tradeInfo.tid,
							tradeInfo.pids,
							tradeInfo.dpids,
						);
					}}
					handleRemove={handleRemove}
					offers={state.offers}
					salaryCap={salaryCap}
					salaryCapType={salaryCapType}
				/>
			</div>

			<div className="d-block d-xxl-none">
				{state.offers.map((offer, i) => {
					return (
						<Offer
							key={offer.tid}
							challengeNoRatings={challengeNoRatings}
							onNegotiate={() => {
								handleNegotiate(offer.tid, offer.pids, offer.dpids);
							}}
							onRemove={() => {
								handleRemove(i);
							}}
							salaryCap={salaryCap}
							salaryCapType={salaryCapType}
							teamInfo={teamInfoCache[offer.tid]}
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
