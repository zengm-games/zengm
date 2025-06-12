import { PHASE } from "../../common/index.ts";
import useTitleBar from "../hooks/useTitleBar.tsx";
import type { View } from "../../common/types.ts";
import { SummaryTeam } from "./Trade/Summary.tsx";
import { toWorker, useLocalPartial } from "../util/index.ts";
import {
	Offer,
	OfferTable,
	type OfferType,
	pickScore,
	playerScore,
} from "./TradingBlock/index.tsx";
import { useEffect, useState } from "react";
import { ActionButton } from "../components/index.tsx";
import useTradeOffersSwitch from "../hooks/useTradeOffersSwitch.tsx";

const TradeProposals = (props: View<"tradeProposals">) => {
	const {
		challengeNoRatings,
		challengeNoTrades,
		gameOver,
		luxuryPayroll,
		luxuryTax,
		offers,
		phase,
		salaryCap,
		salaryCapType,
		spectator,
	} = props;

	const [removedTids, setRemovedTids] = useState<number[]>([]);
	const [prevOffers, setPrevOffers] = useState(offers);

	// Without this, we'd still see the old offers even after 10 games are played and there are new offers
	useEffect(() => {
		const tids = JSON.stringify(offers.map((offer) => offer.tid).sort());
		const prevTids = JSON.stringify(
			prevOffers.map((offer) => offer.tid).sort(),
		);

		if (tids !== prevTids) {
			setRemovedTids([]);
			setPrevOffers(offers);
		}
	}, [offers, prevOffers]);

	useTitleBar({ title: "Trade Proposals" });

	const { teamInfoCache } = useLocalPartial(["teamInfoCache"]);

	const [refreshing, setRefreshing] = useState(false);

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
				.map((p) => `${p.name} ${p.ratings.pos}`)
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
										challengeNoRatings={challengeNoRatings}
										hideFinanceInfo
										hideTeamOvr
										luxuryPayroll={luxuryPayroll}
										luxuryTax={luxuryTax}
										salaryCap={salaryCap}
										salaryCapType={salaryCapType}
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
										challengeNoRatings={challengeNoRatings}
										hideFinanceInfo
										hideTeamOvr
										luxuryPayroll={luxuryPayroll}
										luxuryTax={luxuryTax}
										salaryCap={salaryCap}
										salaryCapType={salaryCapType}
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
					handleRemove={(i) => {
						const tid = offers[i]!.tid;
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
													challengeNoRatings={challengeNoRatings}
													hideFinanceInfo
													luxuryPayroll={luxuryPayroll}
													luxuryTax={luxuryTax}
													salaryCap={salaryCap}
													salaryCapType={salaryCapType}
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
