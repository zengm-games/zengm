import { useState } from "react";
import { confirm, toWorker } from "../../util/index.ts";

export const DraftButtons = ({
	spectator,
	userRemaining,
	usersTurn,
}: {
	spectator: boolean;
	userRemaining: boolean;
	usersTurn: boolean;
}) => {
	// This doesn't capture everything, since things can be triggered from outside of this component, but it's something
	const [running, setRunning] = useState(false);

	return (
		<div className="btn-group">
			<button
				className="btn btn-light-bordered"
				disabled={(usersTurn && !spectator) || running}
				onClick={async () => {
					try {
						setRunning(true);
						await toWorker("playMenu", "onePick", undefined);
					} finally {
						setRunning(false);
					}
				}}
			>
				Sim one pick
			</button>
			<button
				className="btn btn-light-bordered"
				disabled={(usersTurn && !spectator) || !userRemaining || running}
				onClick={async () => {
					try {
						setRunning(true);
						await toWorker("playMenu", "untilYourNextPick", undefined);
					} finally {
						setRunning(false);
					}
				}}
			>
				To your next pick
			</button>
			<button
				className="btn btn-light-bordered"
				disabled={running}
				onClick={async () => {
					try {
						setRunning(true);
						if (userRemaining && !spectator) {
							const result = await confirm(
								"If you proceed, the AI will make your remaining picks for you. Are you sure?",
								{
									okText: "Let AI finish the draft",
									cancelText: "Cancel",
								},
							);

							if (!result) {
								return;
							}
						}
						await toWorker("playMenu", "untilEnd", undefined);
					} finally {
						setRunning(false);
					}
				}}
			>
				To end of draft
			</button>
		</div>
	);
};
