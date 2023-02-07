import { PHASE } from "../../common";
import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";
import { SummaryTeam } from "./Trade/Summary";

const TradeOffers = (props: View<"tradeOffers">) => {
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
			{offers.map((summary, i) => {
				return (
					<div key={i} className="row">
						{summary.teams.map((t, j) => {
							return (
								<div key={j} className="col">
									<SummaryTeam
										challengeNoRatings={challengeNoRatings}
										luxuryPayroll={luxuryPayroll}
										salaryCap={salaryCap}
										salaryCapType={salaryCapType}
										summary={summary}
										t={t}
									/>
								</div>
							);
						})}
					</div>
				);
			})}
		</>
	);
};

export default TradeOffers;
