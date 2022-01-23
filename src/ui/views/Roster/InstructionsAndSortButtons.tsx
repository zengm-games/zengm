import type { View } from "../../../common/types";
import { confirm, toWorker } from "../../util";

const handleAutoSort = async () => {
	await toWorker("main", "autoSortRoster", undefined);
};

const handleResetPT = async () => {
	await toWorker("main", "resetPlayingTime", undefined);
};

const InstructionsAndSortButtons = ({
	keepRosterSorted,
	editable,
	godMode,
	players,
	tid,
}: Pick<View<"roster">, "editable" | "godMode" | "players" | "tid"> & {
	keepRosterSorted: boolean;
}) => {
	return (
		<>
			{editable ? (
				<p
					style={{
						clear: "both",
					}}
				>
					Click or drag row handles to move players between the starting lineup{" "}
					<span className="table-info legend-square" /> and the bench{" "}
					<span className="table-secondary legend-square" />.
				</p>
			) : null}

			{editable || godMode ? (
				<div className="mb-3">
					<div className="btn-group">
						{editable ? (
							<button
								className="btn btn-light-bordered"
								onClick={handleAutoSort}
							>
								Auto sort roster
							</button>
						) : null}
						{editable ? (
							<button
								className="btn btn-light-bordered"
								onClick={handleResetPT}
							>
								Reset playing time
							</button>
						) : null}
						{godMode ? (
							<button
								className="btn btn-outline-god-mode"
								onClick={async () => {
									const proceed = await confirm(
										`Are you sure you want to delete all ${players.length} players on this team?`,
										{
											okText: "Delete Players",
										},
									);
									if (proceed) {
										await toWorker(
											"main",
											"removePlayers",
											players.map(p => p.pid),
										);
									}
								}}
							>
								Delete players
							</button>
						) : null}
					</div>
					{editable ? (
						<div className="form-check mt-2">
							<input
								className="form-check-input"
								type="checkbox"
								checked={keepRosterSorted}
								id="ai-sort-user-roster"
								onChange={async () => {
									if (!keepRosterSorted) {
										await handleAutoSort();
									}
									await toWorker("main", "updateKeepRosterSorted", {
										tid,
										keepRosterSorted: !keepRosterSorted,
									});
								}}
							/>
							<label className="form-check-label" htmlFor="ai-sort-user-roster">
								Keep auto sorted
							</label>
						</div>
					) : null}
				</div>
			) : null}
		</>
	);
};

export default InstructionsAndSortButtons;
