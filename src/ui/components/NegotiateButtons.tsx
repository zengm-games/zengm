import { useState } from "react";
import { showNotification } from "../util/showNotification.ts";
import { toWorker } from "../util/toWorker.ts";

const SignNotification = ({ name, pid }: { name: string; pid: number }) => {
	const [status, setStatus] = useState<"init" | "waiting" | "success" | "fail">(
		"init",
	);

	if (status === "success") {
		return "Signing undone";
	} else if (status === "fail") {
		return "Failed to undo signing";
	} else {
		return (
			<>
				<div>You signed {name}</div>
				<div className="mt-2">
					<button
						className="btn btn-sm btn-secondary"
						disabled={status === "waiting"}
						onClick={async () => {
							setStatus("waiting");
							const result = await toWorker("main", "undoAction", {
								type: "sign",
								pid,
							});
							if (result) {
								setStatus("success");
							} else {
								setStatus("fail");
							}
						}}
					>
						Undo
					</button>
				</div>
			</>
		);
	}
};

export const showSignUndo = (p: { name: string; pid: number }) => {
	showNotification({
		type: "info",
		text: <SignNotification name={p.name} pid={p.pid} />,
	});
};

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
		<>
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
						showNotification({
							type: "error",
							text: errorMsg,
						});
					} else {
						showSignUndo({
							name: `${p.firstName} ${p.lastName}`,
							pid: p.pid,
						});
					}
				}}
			>
				Sign
			</button>
		</>
	);
};
