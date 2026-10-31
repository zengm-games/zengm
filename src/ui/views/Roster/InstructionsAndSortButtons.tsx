import type { View } from "../../../common/types.ts";
import { toWorker } from "../../util/toWorker.ts";

const handleAutoSort = async () => {
	await toWorker("main", "autoSortRoster", undefined);
};

const handleResetPT = async () => {
	await toWorker("main", "resetPlayingTime", undefined);
};

const InstructionsAndSortButtons = ({
	keepRosterSorted,
	editable,
	tid,
}: Pick<View<"roster">, "editable" | "tid"> & {
	keepRosterSorted: boolean;
}) => {
	return (
		<>
			{editable ? (
				<div className="mb-3">
					<div className="d-flex flex-wrap gap-2">
						{editable ? (
							<>
								<button className="btn btn-secondary" onClick={handleAutoSort}>
									Auto sort roster
								</button>
								<button className="btn btn-secondary" onClick={handleResetPT}>
									Reset playing time
								</button>
							</>
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
