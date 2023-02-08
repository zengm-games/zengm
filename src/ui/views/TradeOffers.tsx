import { PHASE } from "../../common";
import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";
import { SummaryTeam } from "./Trade/Summary";
import { toWorker } from "../util";

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
		<div className="d-flex flex-wrap gap-5">
			{offers.map((summary, i) => {
				return (
					<div
						key={i}
						style={{ width: 500 }}
						className="border rounded p-2 h-100"
					>
						<div className="row">
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
						<button
							type="submit"
							className="btn btn-light-bordered mt-auto"
							onClick={async () => {
								await toWorker("actions", "tradeFor", {
									otherDpids: summary.teams[1].picks.map(dp => dp.dpid),
									otherPids: summary.teams[1].trade.map(p => p.pid),
									tid: summary.teams[1].tid,
									userDpids: summary.teams[0].picks.map(dp => dp.dpid),
									userPids: summary.teams[0].trade.map(p => p.pid),
								});
							}}
						>
							Negotiate
						</button>
					</div>
				);
			})}
		</div>
	);
};

export default TradeOffers;
