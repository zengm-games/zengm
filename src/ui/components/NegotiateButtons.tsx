import { logEvent } from "../util/logEvent.ts";
import { toWorker } from "../util/toWorker.ts";

// season is just needed during re-signing, because it's used to make sure drafted players in hard cap leagues always
// are willing to sign.
export const NegotiateButtons = ({
	canGoOverCap,
	capSpace,
	disabled,
	minContract,
	onNegotiate,
	spectator,
	p,
	willingToNegotiate,
}: {
	canGoOverCap?: boolean;
	capSpace: number;
	disabled?: boolean;
	minContract: number;
	onNegotiate: () => void;
	spectator: boolean;
	p: any;
	willingToNegotiate: boolean;
}) => {
	if (spectator) {
		return null;
	}

	if (!willingToNegotiate) {
		return "Refuses!";
	}

	const contractAmount = p.mood.user.contractAmount;

	const signDisabled =
		!canGoOverCap &&
		(!!disabled ||
			(contractAmount / 1000 > capSpace + 1 / 1000 &&
				contractAmount / 1000 > (minContract + 1) / 1000));
	return (
		<div className="btn-group">
			<button
				className="btn btn-light-bordered btn-xs"
				disabled={!!disabled}
				onClick={onNegotiate}
			>
				Negotiate
			</button>
			<button
				className="btn btn-light-bordered btn-xs"
				disabled={signDisabled}
				onClick={async () => {
					const errorMsg = await toWorker("main", "acceptContractNegotiation", {
						pid: p.pid,
						amount: contractAmount,
						exp: p.contract.exp,
					});

					if (errorMsg) {
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
