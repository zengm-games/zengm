import { PHASE } from "../../common";
import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";

const TradeOffers = (props: View<"tradeOffers">) => {
	const { challengeNoRatings, challengeNoTrades, gameOver, phase, spectator } =
		props;

	useTitleBar({ title: "Trade Offers" });

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

	return (
		<>
			<p>Hi</p>
		</>
	);
};

export default TradeOffers;
