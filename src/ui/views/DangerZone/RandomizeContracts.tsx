import { showNotification } from "../../util/showNotification.ts";
import { toWorker } from "../../util/toWorker.ts";
import { useAction } from "../../util/useAction.ts";

export const RandomizeContracts = ({ godMode }: { godMode: boolean }) => {
	const { busy, run } = useAction();

	return (
		<>
			<h2>Randomize contracts</h2>

			<p>
				This gives every player a new contract based on their value and your
				finance settings, similar to a new random players league.
			</p>

			<button
				type="button"
				className="btn btn-god-mode"
				disabled={busy || !godMode}
				onClick={() =>
					run(async () => {
						await toWorker("main", "randomizeContracts", undefined);

						showNotification({
							text: "Contracts have been randomized.",
							type: "info",
						});
					})
				}
			>
				Randomize contracts
			</button>
		</>
	);
};
