import useTitleBar from "../hooks/useTitleBar.tsx";
import type { View } from "../../common/types.ts";
import { toWorker } from "../util/toWorker.ts";
import { useLocal } from "../util/local.ts";
import { useState } from "react";
import { ActionButton } from "../components/ActionButton.tsx";
import useTradeOffersSwitch from "../hooks/useTradeOffersSwitch.tsx";
import { TradeNotAllowed } from "../components/TradeNotAllowed.tsx";
import { TradeSummaryOffers } from "../components/TradeOffers/TradeSummaryOffers.tsx";
import { getTradeBlockedReason } from "../../common/transactionPhases.ts";

const TradeProposals = ({ offers, seed }: View<"tradeProposals">) => {
	const {
		challengeNoTrades,
		gameOver,
		otherTeamsWantToHire,
		phase,
		spectator,
	} = useLocal([
		"challengeNoTrades",
		"gameOver",
		"otherTeamsWantToHire",
		"phase",
		"spectator",
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
			<TradeSummaryOffers
				layout={tradeOffersSwitch.value}
				offers={filteredOffers}
				onRemove={(tid) => {
					setRemovedTids((prevTids) => [...prevTids, tid]);
				}}
			/>
		</>
	);
};

export default TradeProposals;
