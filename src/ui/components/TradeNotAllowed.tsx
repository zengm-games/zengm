import { PHASE } from "../../common/constants.ts";
import type { TradeBlockedReason } from "../../common/transactionPhases.ts";
import { helpers } from "../util/helpers.ts";
import { useLocal } from "../util/local.ts";

export const TradeBlockedText = ({
	reason,
}: {
	reason: TradeBlockedReason;
}) => {
	const { phase } = useLocal(["phase"]);

	if (reason === "spectator") {
		return <>You're not allowed to make trades in spectator mode.</>;
	}

	if (reason === "challengeNoTrades") {
		return (
			<>
				<b>Challenge Mode:</b> You're not allowed to make trades.
			</>
		);
	}

	if (reason === "otherTeamsWantToHire") {
		return (
			<>
				You're not allowed to make trades while you have{" "}
				<a href={helpers.leagueUrl(["new_team"])}>
					open job offers from other teams
				</a>
				.
			</>
		);
	}

	return (
		<>
			You're not allowed to make trades{" "}
			{phase === PHASE.AFTER_TRADE_DEADLINE
				? "after the trade deadline"
				: "now"}
			.
		</>
	);
};

// Shown instead of a page about trading, if the user can't trade right now
export const TradeNotAllowed = ({ reason }: { reason: TradeBlockedReason }) => {
	if (reason === "phase") {
		return (
			<div>
				<h2>Error</h2>
				<p>
					<TradeBlockedText reason={reason} />
				</p>
			</div>
		);
	}

	return (
		<p className="alert alert-danger d-inline-block">
			<TradeBlockedText reason={reason} />
		</p>
	);
};
