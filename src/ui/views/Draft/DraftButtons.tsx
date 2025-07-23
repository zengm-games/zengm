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
	return (
		<div className="btn-group">
			<button
				className="btn btn-light-bordered"
				disabled={usersTurn && !spectator}
				onClick={async () => {
					await toWorker("playMenu", "onePick", undefined);
				}}
			>
				Sim one pick
			</button>
			<button
				className="btn btn-light-bordered"
				disabled={(usersTurn && !spectator) || !userRemaining}
				onClick={async () => {
					await toWorker("playMenu", "untilYourNextPick", undefined);
				}}
			>
				To your next pick
			</button>
			<button
				className="btn btn-light-bordered"
				onClick={async () => {
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
				}}
			>
				To end of draft
			</button>
		</div>
	);
};
