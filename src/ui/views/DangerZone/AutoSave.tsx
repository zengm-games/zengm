import { useState } from "react";
import { useAction } from "../../util/useAction.ts";
import { toWorker } from "../../util/toWorker.ts";

const AutoSave = ({
	autoSave,
	godMode,
}: {
	autoSave: boolean;
	godMode: boolean;
}) => {
	const { busy: processing, run } = useAction();
	const [autoSaveTemp, setAutoSaveTemp] = useState(autoSave);

	const disabled = processing || !godMode;

	return (
		<>
			<p>
				Current auto save status:{" "}
				{autoSaveTemp ? (
					<span className="text-success">enabled</span>
				) : (
					<span className="text-danger">disabled</span>
				)}
			</p>

			{autoSaveTemp ? (
				<button
					className="btn btn-light-bordered"
					disabled={disabled}
					onClick={() =>
						run(async () => {
							await toWorker("main", "setAutoSave", false);
							setAutoSaveTemp(false);
						})
					}
				>
					Disable auto save
				</button>
			) : (
				<>
					<button
						className="btn btn-success"
						disabled={disabled}
						onClick={() =>
							run(async () => {
								await toWorker("main", "setAutoSave", true);
								setAutoSaveTemp(true);
							})
						}
					>
						Save current progress and enable auto save
					</button>
					<div className="mt-3">
						<button
							className="btn btn-danger"
							disabled={disabled}
							onClick={() =>
								run(async () => {
									await toWorker("main", "discardUnsavedProgress", undefined);
									await toWorker("main", "setAutoSave", false);
									setAutoSaveTemp(false);
								})
							}
						>
							Go back to previous save state
						</button>
					</div>
				</>
			)}
		</>
	);
};

export default AutoSave;
