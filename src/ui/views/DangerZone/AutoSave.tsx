import { useState } from "react";
import { helpers, toWorker } from "../../util";

const AutoSave = ({
	autoSave,
	godMode,
}: {
	autoSave: boolean;
	godMode: boolean;
}) => {
	const [processing, setProcessing] = useState(false);
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

			{!godMode ? (
				<p className="text-warning">
					This feature is only available in{" "}
					<a href={helpers.leagueUrl(["god_mode"])}>God Mode</a>.
				</p>
			) : null}
			{autoSaveTemp ? (
				<button
					className="btn btn-light-bordered"
					disabled={disabled}
					onClick={async () => {
						setProcessing(true);
						await toWorker("main", "setLocal", ["autoSave", false]);
						setAutoSaveTemp(false);
						setProcessing(false);
					}}
				>
					Disable auto save
				</button>
			) : (
				<>
					<button
						className="btn btn-success"
						disabled={disabled}
						onClick={async () => {
							setProcessing(true);
							await toWorker("main", "setLocal", ["autoSave", true]);
							setAutoSaveTemp(true);
							setProcessing(false);
						}}
					>
						Save current progress and enable auto save
					</button>
					<div className="mt-3">
						<button
							className="btn btn-danger"
							disabled={disabled}
							onClick={async () => {
								setProcessing(true);
								await toWorker("main", "discardUnsavedProgress", undefined);
								await toWorker("main", "setLocal", ["autoSave", false]);
								setAutoSaveTemp(false);
								setProcessing(false);
							}}
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
