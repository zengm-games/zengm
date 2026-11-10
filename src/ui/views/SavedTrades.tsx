import useTitleBar from "../hooks/useTitleBar.tsx";
import type { View } from "../../common/types.ts";
import { helpers } from "../util/helpers.ts";
import { toWorker } from "../util/toWorker.ts";
import { useLocal } from "../util/local.ts";
import { Dropdown } from "react-bootstrap";
import useTradeOffersSwitch from "../hooks/useTradeOffersSwitch.tsx";
import { TradeNotAllowed } from "../components/TradeNotAllowed.tsx";
import { TradeSummaryOffers } from "../components/TradeOffers/TradeSummaryOffers.tsx";
import { getTradeBlockedReason } from "../../common/transactionPhases.ts";

const SavedTrades = ({ offers }: View<"savedTrades">) => {
	useTitleBar({ title: "Saved Trades" });

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

	return (
		<>
			<p>
				Add trades to this list by clicking the "save trade" icon{" "}
				<span className="glyphicon glyphicon-flag" /> on any of the{" "}
				<a href={helpers.leagueUrl(["trade"])}>Trade</a>,{" "}
				<a href={helpers.leagueUrl(["trading_block"])}>Trading Block</a>, or{" "}
				<a href={helpers.leagueUrl(["trade_proposals"])}>Trade Proposals</a>{" "}
				pages.
			</p>
			<Dropdown>
				<Dropdown.Toggle variant="danger">Clear</Dropdown.Toggle>
				<Dropdown.Menu>
					<Dropdown.Item
						onClick={async () => {
							const hashes = offers.map((offer) => offer.hash);
							await toWorker("main", "clearSavedTrades", hashes);
						}}
					>
						All saved trades
					</Dropdown.Item>
					<Dropdown.Item
						onClick={async () => {
							const hashes = offers
								.filter(
									(offer) =>
										offer.missing.length > 0 || offer.missingUser.length > 0,
								)
								.map((offer) => offer.hash);
							await toWorker("main", "clearSavedTrades", hashes);
						}}
					>
						Trades with invalid assets
					</Dropdown.Item>
				</Dropdown.Menu>
			</Dropdown>
			{offers.length === 0 ? (
				<div className="mt-3">No saved trades</div>
			) : (
				tradeOffersSwitch.toggle
			)}
			<TradeSummaryOffers layout={tradeOffersSwitch.value} offers={offers} />
		</>
	);
};

export default SavedTrades;
