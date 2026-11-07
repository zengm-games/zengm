import useTitleBar from "../hooks/useTitleBar.tsx";
import type { View } from "../../common/types.ts";
import { SummaryTeam } from "./Trade/Summary.tsx";
import { toWorker } from "../util/toWorker.ts";
import { useLocal } from "../util/local.ts";
import {
	Offer,
	OfferTable,
	type OfferType,
	pickScore,
	playerScore,
} from "./TradingBlock/index.tsx";
import { useState } from "react";
import { ActionButton } from "../components/ActionButton.tsx";
import useTradeOffersSwitch from "../hooks/useTradeOffersSwitch.tsx";
import { TradeNotAllowed } from "../components/TradeNotAllowed.tsx";
import { getTradeBlockedReason } from "../../common/transactionPhases.ts";

const TradeProposals = ({ offers, seed }: View<"tradeProposals">) => {
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

	const [removedTids, setRemovedTids] = useState<number[]>([]);

	// Without this, we'd still see the old removedTids even after 10 games are played and there are new offers
	const [prevSeed, setPrevSeed] = useState(seed);
	if (seed !== prevSeed) {
		setRemovedTids([]);
		setPrevSeed(seed);
	}

	useTitleBar({ title: "Trade Proposals" });

	const [refreshing, setRefreshing] = useState(false);

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

	const handleNegotiate = async (offer: {
		dpids: number[];
		dpidsUser: number[];
		pids: number[];
		pidsUser: number[];
		tid: number;
	}) => {
		await toWorker("actions", "tradeFor", {
			otherDpids: offer.dpids,
			otherPids: offer.pids,
			tid: offer.tid,
			userDpids: offer.dpidsUser,
			userPids: offer.pidsUser,
		});
	};

	const getSearchSortValues = (
		players: OfferType["players"],
		picks: OfferType["picks"],
	) => {
		return {
			searchValue: `${players
				.map((p) => `${p.firstName} ${p.lastName} ${p.ratings.pos}`)
				.join(" ")} ${picks.map((pick) => pick.desc).join(" ")}`,
			sortValue: playerScore(players) + pickScore(picks),
		};
	};

	const filteredOffers = offers.filter(
		(offer) => !removedTids.includes(offer.tid),
	);

	return (
		<>
			<p>
				These are trade proposals from up to 5 AI teams. New teams will appear
				here every 10 games.
			</p>
			<ActionButton
				onClick={async () => {
					setRefreshing(true);
					await toWorker("main", "incrementTradeProposalsSeed", undefined);
					setRefreshing(false);
				}}
				processing={refreshing}
				processingText="Loading"
				variant="secondary"
			>
				Refresh trade proposals
			</ActionButton>
			{tradeOffersSwitch.toggle}
			{tradeOffersSwitch.value === "table" ? (
				<OfferTable
					assetCols={[
						{
							title: "You receive",
							sortSequence: ["desc", "asc"],
							sortType: "number",
						},
						{
							title: "You trade away",
							sortSequence: ["desc", "asc"],
							sortType: "number",
						},
					]}
					getAssetColContents={(offer) => {
						return [
							{
								value: (
									<SummaryTeam
										hideFinanceInfo
										hideTeamOvr
										showInlinePlayerInfo
										summary={offer.summary}
										t={offer.summary.teams[0]}
									/>
								),
								...getSearchSortValues(offer.players, offer.picks),
							},
							{
								value: (
									<SummaryTeam
										hideFinanceInfo
										hideTeamOvr
										showInlinePlayerInfo
										summary={offer.summary}
										t={offer.summary.teams[1]}
									/>
								),
								...getSearchSortValues(offer.playersUser, offer.picksUser),
							},
						];
					}}
					challengeNoRatings={challengeNoRatings}
					handleNegotiate={handleNegotiate}
					handleRemove={(tid) => {
						setRemovedTids((prevTids) => [...prevTids, tid]);
					}}
					offers={filteredOffers}
					salaryCap={salaryCap}
					salaryCapType={salaryCapType}
				/>
			) : (
				<>
					{filteredOffers.map((offer, i) => {
						return (
							<Offer
								key={offer.tid}
								challengeNoRatings={challengeNoRatings}
								onNegotiate={() => {
									handleNegotiate(offer);
								}}
								onRemove={() => {
									const tid = offer.tid;
									setRemovedTids((prevTids) => [...prevTids, tid]);
								}}
								salaryCap={salaryCap}
								salaryCapType={salaryCapType}
								teamInfo={teamInfoCache[offer.tid]!}
								hideTopTeamOvrs
								first={i === 0}
								{...offer}
							>
								<div className="d-flex gap-5">
									{offer.summary.teams.map((t, j) => {
										return (
											<div key={j}>
												<SummaryTeam
													hideFinanceInfo
													showInlinePlayerInfo
													summary={offer.summary}
													t={t}
												/>
											</div>
										);
									})}
								</div>
							</Offer>
						);
					})}
				</>
			)}
		</>
	);
};

export default TradeProposals;
