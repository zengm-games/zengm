import { PHASE } from "../../common";
import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";
import { SummaryTeam } from "./Trade/Summary";
import { toWorker, useLocalPartial } from "../util";
import { Offer } from "./TradingBlock";

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

	return (
		<>
			<div className="d-block d-xxl-none">
				{offers.map((offer, i) => {
					return (
						<Offer
							key={offer.tid}
							challengeNoRatings={challengeNoRatings}
							onNegotiate={async () => {
								await toWorker("actions", "tradeFor", {
									otherDpids: offer.dpids,
									otherPids: offer.pids,
									tid: offer.tid,
									userDpids: offer.dpidsUser,
									userPids: offer.pidsUser,
								});
							}}
							onRemove={() => {
								console.log("Remove", i);
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

export default TradeOffers;
