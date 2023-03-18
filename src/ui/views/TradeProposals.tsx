import { PHASE } from "../../common";
import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";
import { SummaryTeam } from "./Trade/Summary";
import { toWorker, useLocalPartial } from "../util";
import {
	Offer,
	OfferTable,
	type OfferType,
	pickScore,
	playerScore,
} from "./TradingBlock";
import { useEffect, useState } from "react";

const TradeProposals = (props: View<"tradeProposals">) => {
	const {
		challengeNoRatings,
		challengeNoTrades,
		gameOver,
		luxuryPayroll,
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
		const tids = JSON.stringify(offers.map(offer => offer.tid).sort());
		const prevTids = JSON.stringify(prevOffers.map(offer => offer.tid).sort());

		if (tids !== prevTids) {
			setRemovedTids([]);
			setPrevOffers(offers);
		}
	}, [offers, prevOffers]);

	useTitleBar({ title: "Trade Proposals" });

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
				.map(p => `${p.name} ${p.ratings.pos}`)
				.join(" ")} ${picks.map(pick => pick.desc).join(" ")}`,
			sortValue: playerScore(players) + pickScore(picks),
		};
	};

	const filteredOffers = offers.filter(
		offer => !removedTids.includes(offer.tid),
	);

	return (
		<>
			<p>
				These are trade proposals from up to 5 AI teams. New teams will appear
				here every 10 games.
			</p>
			<div className="d-none d-lg-block">
				<OfferTable
					assetCols={[
						{
							title: "You Receive",
							sortSequence: ["desc", "asc"],
							sortType: "number",
						},
						{
							title: "You Trade Away",
							sortSequence: ["desc", "asc"],
							sortType: "number",
						},
					]}
					getAssetColContents={offer => {
						return [
							{
								value: (
									<SummaryTeam
										challengeNoRatings={challengeNoRatings}
										hideFinanceInfo
										hideTeamOvr
										luxuryPayroll={luxuryPayroll}
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
					handleRemove={i => {
						const tid = offers[i].tid;
						setRemovedTids(prevTids => [...prevTids, tid]);
					}}
					offers={filteredOffers}
					salaryCap={salaryCap}
					salaryCapType={salaryCapType}
				/>
			</div>

			<div className="d-block d-lg-none">
				{filteredOffers.map(offer => {
					return (
						<Offer
							key={offer.tid}
							challengeNoRatings={challengeNoRatings}
							onNegotiate={() => {
								handleNegotiate(offer);
							}}
							onRemove={() => {
								const tid = offer.tid;
								setRemovedTids(prevTids => [...prevTids, tid]);
							}}
							salaryCap={salaryCap}
							salaryCapType={salaryCapType}
							teamInfo={teamInfoCache[offer.tid]}
							hideTopTeamOvrs
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
			</div>
		</>
	);
};

export default TradeProposals;
