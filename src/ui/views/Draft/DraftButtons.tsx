import { toWorker } from "../../util/toWorker.ts";
import { useAction } from "../../util/useAction.ts";
import { confirm } from "../../util/confirm.tsx";

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
	const { busy: running, run } = useAction();

	return (
		<div className="btn-group">
			<button
				className="btn btn-light-bordered"
				disabled={(usersTurn && !spectator) || running}
				onClick={() => run(() => toWorker("playMenu", "onePick", undefined))}
			>
				Sim one pick
			</button>
			<button
				className="btn btn-light-bordered"
				disabled={(usersTurn && !spectator) || !userRemaining || running}
				onClick={() =>
					run(() => toWorker("playMenu", "untilYourNextPick", undefined))
				}
			>
				To your next pick
			</button>
			<button
				className="btn btn-light-bordered"
				disabled={running}
				onClick={() =>
					run(async () => {
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
					})
				}
			>
				To end of draft
			</button>
		</div>
	);
};
