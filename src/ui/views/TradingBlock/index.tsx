import { useState, type ReactNode } from "react";
import { PHASE } from "../../../common";
import useTitleBar from "../../hooks/useTitleBar";
import { getCols, helpers, toWorker, useLocalPartial } from "../../util";
import {
	ActionButton,
	DataTable,
	HelpPopover,
	SafeHtml,
	SaveTrade,
} from "../../components";
import type { Col } from "../../components/DataTable";
import type { View } from "../../../common/types";
import type api from "../../../worker/api";
import clsx from "clsx";
import {
	wrappedContractAmount,
	wrappedContractExp,
} from "../../components/contract";
import { wrappedPlayerNameLabels } from "../../components/PlayerNameLabels";
import { MissingAssets, OvrChange } from "../Trade/Summary";
import type { MissingAsset } from "../../../worker/views/savedTrades";
import useTradeOffersSwitch from "../../hooks/useTradeOffersSwitch";
import LookingFor from "./LookingFor";
import useLookingForState from "./useLookingForState";
import { Dropdown, SplitButton } from "react-bootstrap";

export type OfferType = Awaited<
	ReturnType<(typeof api)["main"]["getTradingBlockOffers"]>
>[0] & {
	missing?: MissingAsset[];
	missingUser?: MissingAsset[];
	willing?: boolean;
};

type OfferProps = {
	children: ReactNode;
	first: boolean;
	hideTopTeamOvrs?: boolean;
	onNegotiate: () => void;
	onRemove?: () => void;
	teamInfo: {
		abbrev: string;
		name: string;
		region: string;
	};
} & OfferType &
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

		let sumContracts = 0;
		const rows = players.map(p => {
			sumContracts += p.contract.amount;
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

		let footer;
		if (sumContracts !== 0 && players.length > 1) {
			footer = [];
			// Total text is too distracting, and it's usually a small number of players
			/*footer[0] = (
				<div className="text-end">
					Total ({players.length} {helpers.plural("player", players.length)}
					)
				</div>
			);*/
			footer[5] = helpers.formatCurrency(sumContracts, "M");
		}

		return (
			<DataTable
				classNameWrapper={className}
				cols={cols}
				defaultSort={[5, "desc"]}
				defaultStickyCols={window.mobile ? 0 : 1}
				footer={footer}
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
		dpids,
		dpidsUser,
		first,
		hideTopTeamOvrs,
		onNegotiate,
		onRemove,
		payroll,
		pids,
		pidsUser,
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

	const { userTid } = useLocalPartial(["userTid"]);

	if (!teamInfo) {
		return null;
	}

	return (
		<div className={first ? undefined : "mt-4"} style={{ maxWidth: 1125 }}>
			<div className="d-flex align-items-center mb-2">
				<h2 className="mb-0">
					<a href={helpers.leagueUrl(["roster", `${teamInfo.abbrev}_${tid}`])}>
						{teamInfo.region} {teamInfo.name}
					</a>
				</h2>
				<SaveTrade
					className="ms-4"
					tradeTeams={[
						{
							pids: pidsUser,
							dpids: dpidsUser,
							tid: userTid,
						},
						{
							pids: pids,
							dpids: dpids,
							tid,
						},
					]}
				/>
				{onRemove ? (
					<button
						type="button"
						className="btn-close ms-4"
						title="Remove trade from list"
						onClick={onRemove}
					/>
				) : null}
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
	handleRemove?: (i: number) => void;
	offers: OfferType[];
} & Pick<
	View<"tradingBlock">,
	"challengeNoRatings" | "salaryCap" | "salaryCapType"
>) => {
	const { teamInfoCache, userTid } = useLocalPartial([
		"teamInfoCache",
		"userTid",
	]);

	const offerCols = getCols(
		[
			"",
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
			"": {
				width: "1px",
			},
			Actions: {
				sortSequence: [],
				width: "1px",
			},
		},
	);
	offerCols[4].title = "Your Ovr";
	offerCols[4].desc = "Your team's change in ovr rating";
	offerCols[5].title = "Other Ovr";
	offerCols[5].desc = "Other team's change in ovr rating";
	offerCols.splice(6, 0, ...assetCols);

	const offerRows = offers.map((offer, i) => {
		const salaryCapOrPayroll =
			salaryCapType === "none" ? offer.payroll : salaryCap - offer.payroll;

		const t = teamInfoCache[offer.tid];
		if (!t) {
			return {
				key: i,
				data: [],
			};
		}

		return {
			key: i,
			data: [
				<SaveTrade
					tradeTeams={[
						{
							pids: offer.pidsUser,
							dpids: offer.dpidsUser,
							tid: userTid,
						},
						{
							pids: offer.pids,
							dpids: offer.dpids,
							tid: offer.tid,
						},
					]}
				/>,
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
					classNames: clsx(
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
					{handleRemove ? (
						<button
							type="button"
							className="btn-close ms-2 p-0"
							title="Remove trade from list"
							onClick={() => {
								handleRemove(i);
							}}
						/>
					) : null}
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
			defaultSort={[1, "asc"]}
			name={`TradingBlock:Offers`}
			rows={offerRows}
			small={false}
		/>
	);
};

const WillingText = ({ willing }: { willing: boolean | undefined }) => {
	if (willing === false) {
		return (
			<div className="text-danger fw-bold">
				AI team is no longer willing to make this trade!
			</div>
		);
	}

	return null;
};

const MissingAndWilling = ({
	missingAssets,
	willing,
}: {
	missingAssets: MissingAsset[] | undefined;
	willing: boolean | undefined;
}) => {
	return (
		<div className="d-flex flex-column gap-3">
			{missingAssets && missingAssets.length > 0 ? (
				<div>
					<MissingAssets missingAssets={missingAssets} />
				</div>
			) : null}
			<WillingText willing={willing} />
		</div>
	);
};

const TradingBlock = ({
	challengeNoRatings,
	challengeNoTrades,
	gameOver,
	initialDpid,
	initialPid,
	phase,
	salaryCap,
	salaryCapType,
	savedTradingBlock,
	spectator,
	stats,
	userPicks,
	userRoster,
}: View<"tradingBlock">) => {
	const [state, setState] = useState<{
		asking: boolean;
		offers: OfferType[];
		noOffers: boolean;
		pids: number[];
		dpids: number[];
	}>(() => {
		let pids: number[];
		if (initialPid !== undefined) {
			pids = [initialPid];
		} else if (savedTradingBlock) {
			pids = savedTradingBlock.pids;
		} else {
			pids = [];
		}

		let dpids: number[];
		if (initialDpid !== undefined) {
			dpids = [initialDpid];
		} else if (savedTradingBlock) {
			dpids = savedTradingBlock.dpids;
		} else {
			dpids = [];
		}

		return {
			asking: false,
			offers: savedTradingBlock?.offers ?? [],
			noOffers: false, // Only set true in response to a click
			pids,
			dpids,
		};
	});

	const [lookingForState, setLookingForState, resetLookingForState] =
		useLookingForState(savedTradingBlock?.lookingFor);

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
		}));

		const offers = await toWorker("main", "getTradingBlockOffers", {
			pids: state.pids,
			dpids: state.dpids,
			lookingFor: lookingForState,
		});

		setState(prevState => ({
			...prevState,
			asking: false,
			noOffers: offers.length === 0,
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

	const clear = async (type: "all" | "lookingFor" | "assets") => {
		if (type === "all" || type === "lookingFor") {
			resetLookingForState();
		}

		if (type === "all" || type === "assets") {
			setState(state => {
				return {
					...state,
					asking: false,
					pids: [],
					dpids: [],
				};
			});
		}
	};

	useTitleBar({ title: "Trading Block" });

	const { teamInfoCache } = useLocalPartial(["teamInfoCache"]);

	const tradeOffersSwitch = useTradeOffersSwitch();

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

	let sumContracts = 0;
	for (const p of userRoster) {
		if (state.pids.includes(p.pid)) {
			sumContracts += p.contract.amount;
		}
	}

	const footer = [];
	footer[1] = (
		<div className="text-end">
			Total ({state.pids.length} {helpers.plural("player", state.pids.length)})
		</div>
	);
	footer[6] = helpers.formatCurrency(sumContracts, "M");

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
			<div className="row">
				<div className="col-md-9">
					<DataTable
						classNameWrapper="mb-3 mb-md-0"
						cols={cols}
						defaultSort={[6, "desc"]}
						defaultStickyCols={window.mobile ? 1 : 2}
						name="TradingBlock"
						rows={rows}
						footer={footer}
					/>
				</div>
				<div className="col-md-3 trading-block-draft-picks-wrapper">
					<DataTable
						classNameWrapper="mb-0"
						cols={pickCols}
						defaultSort={[1, "asc"]}
						hideAllControls
						hideMenuToo
						name={`TradingBlock:Picks`}
						rows={pickRows}
					/>
				</div>
			</div>

			<div className="my-5">
				<LookingFor
					disabled={state.asking}
					state={lookingForState}
					setState={setLookingForState}
				/>
			</div>

			<div className="trading-block-buttons">
				<ActionButton
					processing={state.asking}
					onClick={handleClickAsk}
					size="lg"
					variant="primary"
					className="me-2"
				>
					Ask for trade proposals
				</ActionButton>
				<SplitButton
					variant="secondary"
					size="lg"
					disabled={state.asking}
					onClick={() => clear("all")}
					title="Clear"
				>
					<Dropdown.Item onClick={() => clear("all")}>
						All (default)
					</Dropdown.Item>
					<Dropdown.Item onClick={() => clear("assets")}>
						Players/picks only
					</Dropdown.Item>
					<Dropdown.Item onClick={() => clear("lookingFor")}>
						Looking for only
					</Dropdown.Item>
				</SplitButton>
			</div>

			{state.noOffers ? (
				<div className="alert alert-danger mb-0 mt-3 d-inline-block">
					No team made an offer.
				</div>
			) : null}

			{state.offers.length > 0 ? (
				<div className="mt-3 mt-md-0">{tradeOffersSwitch.toggle}</div>
			) : null}

			{tradeOffersSwitch.value === "table" ? (
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
									<>
										<OfferPlayers
											className="mb-0"
											challengeNoRatings={challengeNoRatings}
											players={offer.players}
											stats={stats}
										/>
										{(offer.missing && offer.missing.length > 0) ||
										offer.willing === false ? (
											<div className="mt-3">
												<MissingAndWilling
													missingAssets={offer.missing}
													willing={offer.willing}
												/>
											</div>
										) : null}
									</>
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
			) : (
				<>
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
								first={i === 0}
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
												{(offer.missing && offer.missing.length > 0) ||
												offer.willing === false ? (
													<div className="mb-3">
														<MissingAndWilling
															missingAssets={offer.missing}
															willing={offer.willing}
														/>
													</div>
												) : null}
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
				</>
			)}
		</>
	);
};

export default TradingBlock;
