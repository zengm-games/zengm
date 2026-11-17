import { useState } from "react";
import useTitleBar from "../../hooks/useTitleBar.tsx";
import { helpers } from "../../util/helpers.ts";
import { toWorker } from "../../util/toWorker.ts";
import { getCols } from "../../../common/getCols.ts";
import { useLocal } from "../../util/local.ts";
import { DataTable } from "../../components/DataTable/index.tsx";
import type { View } from "../../../common/types.ts";
import {
	wrappedContractAmount,
	wrappedContractExp,
} from "../../components/contract.tsx";
import { wrappedPlayerNameLabels } from "../../components/PlayerNameLabels.tsx";
import { MissingAssets } from "../Trade/Summary.tsx";
import type { MissingAsset } from "../../../worker/views/savedTrades.ts";
import useTradeOffersSwitch from "../../hooks/useTradeOffersSwitch.tsx";
import LookingFor from "./LookingFor.tsx";
import useLookingForState from "./useLookingForState.ts";
import { Dropdown, SplitButton } from "react-bootstrap";
import type { FooterRow } from "../../components/DataTable/Footer.tsx";
import { orderBy } from "../../../common/utils.ts";
import { SafeHtml } from "../../components/SafeHtml.tsx";
import { ActionButton } from "../../components/ActionButton.tsx";
import { TradeNotAllowed } from "../../components/TradeNotAllowed.tsx";
import { getTradeBlockedReason } from "../../../common/transactionPhases.ts";
import { Offer, type OfferType } from "../../components/TradeOffers/Offer.tsx";
import { OfferTable } from "../../components/TradeOffers/OfferTable.tsx";
import { pickScore, playerScore } from "../../components/TradeOffers/scores.ts";

const OfferPlayers = ({
	className,
	challengeNoRatings,
	players,
	stats,
}: Pick<OfferType, "players"> & {
	className?: string;
	challengeNoRatings: boolean;
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
				...stats.map((stat) => `stat:${stat}`),
			],
			{
				Name: {
					width: "100%",
				},
			},
		);

		let sumContracts = 0;
		const rows = players.map((p) => {
			// eslint-disable-next-line react-hooks/immutability -- https://github.com/react/react/issues/31569
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
					...stats.map((stat) => helpers.roundStat(p.stats[stat], stat)),
				],
			};
		});

		let footer: FooterRow | undefined;
		if (sumContracts !== 0 && players.length > 1) {
			footer = { data: [] };
			// Total text is too distracting, and it's usually a small number of players
			/*footer[0] = (
				<div className="text-end">
					Total ({players.length} {helpers.plural("player", players.length)}
					)
				</div>
			);*/
			footer.data[5] = helpers.formatCurrency(sumContracts, "M");
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

const pickCols = getCols(["", "Draft Picks"], {
	"": {
		sortSequence: [],
	},
	"Draft Picks": {
		width: "100%",
	},
});

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
	initialDpids,
	initialPids,
	savedTradingBlock,
	stats,
	userPicks,
	userRoster,
}: View<"tradingBlock">) => {
	const {
		challengeNoRatings,
		challengeNoTrades,
		gameOver,
		otherTeamsWantToHire,
		phase,
		salaryCap,
		salaryCapType,
		spectator,
		teamInfoCache,
	} = useLocal([
		"challengeNoRatings",
		"challengeNoTrades",
		"gameOver",
		"otherTeamsWantToHire",
		"phase",
		"salaryCap",
		"salaryCapType",
		"spectator",
		"teamInfoCache",
	]);

	const [state, setState] = useState<{
		asking: boolean;
		offers: OfferType[];
		noOffers: boolean;
		pids: number[];
		dpids: number[];
	}>(() => {
		let pids: number[];
		if (initialPids !== undefined) {
			pids = initialPids;
		} else if (savedTradingBlock) {
			pids = savedTradingBlock.pids;
		} else {
			pids = [];
		}

		let dpids: number[];
		if (initialDpids !== undefined) {
			dpids = initialDpids;
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
		setState((prevState) => {
			const ids = {
				pids: helpers.deepCopy(prevState.pids),
				dpids: helpers.deepCopy(prevState.dpids),
			};

			if (ids[type].includes(id)) {
				ids[type] = ids[type].filter((currId) => currId !== id);
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
		setState((prevState) => ({
			...prevState,
			asking: true,
		}));

		const offers = await toWorker("main", "getTradingBlockOffers", {
			pids: state.pids,
			dpids: state.dpids,
			lookingFor: lookingForState,
		});

		setState((prevState) => ({
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

	const handleRemove = (tid: number) => {
		setState((prevState) => ({
			...prevState,
			offers: prevState.offers.filter((offer) => offer.tid !== tid),
		}));
	};

	const clear = (type: "all" | "lookingFor" | "assets") => {
		if (type === "all" || type === "lookingFor") {
			resetLookingForState();
		}

		if (type === "all" || type === "assets") {
			setState((state) => {
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

	const tradeOffersSwitch = useTradeOffersSwitch();

	const tradeBlockedReason = getTradeBlockedReason({
		challengeNoTrades,
		gameOver,
		otherTeamsWantToHire,
		phase,
		spectator,
	});
	if (tradeBlockedReason) {
		return <TradeNotAllowed reason={tradeBlockedReason} />;
	}

	let sumContracts = 0;
	for (const p of userRoster) {
		if (state.pids.includes(p.pid)) {
			sumContracts += p.contract.amount;
		}
	}

	const footer: FooterRow = { data: [] };
	footer.data[1] = (
		<div className="text-end">
			Total ({state.pids.length} {helpers.plural("player", state.pids.length)})
		</div>
	);
	footer.data[6] = helpers.formatCurrency(sumContracts, "M");

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
			...stats.map((stat) => `stat:${stat}`),
		],
		{
			"": {
				noSearch: true,
				sortSequence: [],
				width: "1%",
			},
		},
	);

	const rows = userRoster.map((p) => {
		const checked = state.pids.includes(p.pid);

		return {
			key: p.pid,
			data: [
				{
					title: p.untradableMsg,
					value: (
						<input
							className="form-check-input"
							type="checkbox"
							checked={checked}
							disabled={p.untradable}
							onChange={() => handleChangeAsset("pids", p.pid)}
						/>
					),
				},
				wrappedPlayerNameLabels({
					pid: p.pid,
					injury: p.injury,
					jerseyNumber: p.jerseyNumber,
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
				wrappedContractAmount(p),
				wrappedContractExp(p),
				...stats.map((stat) => helpers.roundStat(p.stats[stat], stat)),
			],
			classNames: {
				"table-danger": p.untradable && !checked,
			},
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
					getAssetColContents={(offer) => {
						const picks = orderBy(offer.picks, ["round", "pick", "season"]);

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
									.map((p) => `${p.firstName} ${p.lastName} ${p.ratings.pos}`)
									.join(" "),
								sortValue: playerScore(offer.players),
							},
							{
								value: (
									<ul className="list-unstyled mb-0">
										{picks.map((pick) => (
											<li key={pick.dpid}>
												<SafeHtml dirty={pick.desc} />
											</li>
										))}
									</ul>
								),
								searchValue: picks.map((pick) => pick.desc).join(" "),
								sortValue: pickScore(picks),
							},
						];
					}}
					challengeNoRatings={challengeNoRatings}
					handleNegotiate={async (tradeInfo) => {
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
						const picks = orderBy(offer.picks, ["round", "pick", "season"]);

						return (
							<Offer
								key={offer.tid}
								challengeNoRatings={challengeNoRatings}
								onNegotiate={() => {
									handleNegotiate(offer.tid, offer.pids, offer.dpids);
								}}
								onRemove={() => {
									handleRemove(offer.tid);
								}}
								salaryCap={salaryCap}
								salaryCapType={salaryCapType}
								teamInfo={teamInfoCache[offer.tid]!}
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
										{picks.length > 0 ? (
											<div className="col-md-4">
												<table className="table table-striped table-borderless table-sm">
													<thead>
														<tr>
															<th>Draft Picks</th>
														</tr>
													</thead>
													<tbody>
														{picks.map((pick) => (
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
