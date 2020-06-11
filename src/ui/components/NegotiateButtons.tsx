import PropTypes from "prop-types";
import React from "react";
import { helpers, logEvent, toWorker } from "../util";
import type { Player, Phase } from "../../common/types";

// season is just needed during re-signing, because it's used to make sure drafted players in hard cap leagues always
// are willing to sign.
const NegotiateButtons = ({
	canGoOverCap,
	capSpace,
	challengeNoFreeAgents,
	disabled,
	minContract,
	p,
	phase,
	playersRefuseToNegotiate,
	salaryCap,
	season,
	userTid,
}: {
	canGoOverCap?: boolean;
	capSpace: number;
	challengeNoFreeAgents: boolean;
	disabled?: boolean;
	minContract: number;
	p: Player;
	phase: Phase;
	playersRefuseToNegotiate: boolean;
	salaryCap: number;
	season?: number;
	userTid: number;
}) => {
	if (
		helpers.refuseToNegotiate({
			amount: p.contract.amount * 1000,
			mood: p.freeAgentMood[userTid],
			salaryCap,
			playersRefuseToNegotiate,
			rookie: typeof season === "number" && p.draft.year === season,
			challengeNoFreeAgents,
			minContract,
			phase,
		})
	) {
		return "Refuses!";
	}

	const signDisabled =
		!canGoOverCap &&
		(!!disabled ||
			(p.contract.amount > capSpace + 1 / 1000 &&
				p.contract.amount > (minContract + 1) / 1000));
	return (
		<div className="btn-group">
			<button
				className="btn btn-light-bordered btn-xs"
				disabled={!!disabled}
				onClick={() => toWorker("actions", "negotiate", p.pid)}
			>
				Negotiate
			</button>
			<button
				className="btn btn-light-bordered btn-xs"
				disabled={signDisabled}
				onClick={async () => {
					const errorMsg = await toWorker(
						"main",
						"sign",
						p.pid,
						p.contract.amount * 1000,
						p.contract.exp,
					);

					if (errorMsg !== undefined && errorMsg) {
						logEvent({
							type: "error",
							text: errorMsg,
							saveToDb: false,
						});
					}
				}}
			>
				Sign
			</button>
		</div>
	);
};

NegotiateButtons.propTypes = {
	disabled: PropTypes.bool,
	p: PropTypes.object.isRequired,
	playersRefuseToNegotiate: PropTypes.bool.isRequired,
	salaryCap: PropTypes.number.isRequired,
	season: PropTypes.number,
	userTid: PropTypes.number.isRequired,
};

export default NegotiateButtons;
