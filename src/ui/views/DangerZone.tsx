import React, { useState } from "react";
import useTitleBar from "../hooks/useTitleBar";
import { toWorker } from "../util";

const AutoSave = ({ autoSave }: { autoSave: boolean }) => {
	const [processing, setProcessing] = useState(false);
	const [autoSaveTemp, setAutoSaveTemp] = useState(autoSave);

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
					disabled={processing}
					onClick={async () => {
						setProcessing(true);
						await toWorker("main", "setLocal", "autoSave", false);
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
						disabled={processing}
						onClick={async () => {
							setProcessing(true);
							await toWorker("main", "setLocal", "autoSave", true);
							setAutoSaveTemp(true);
							setProcessing(false);
						}}
					>
						Save current progress and enable auto save
					</button>
					<div className="mt-3">
						<button
							className="btn btn-danger"
							disabled={processing}
							onClick={async () => {
								setProcessing(true);
								await toWorker("main", "discardUnsavedProgress");
								await toWorker("main", "setLocal", "autoSave", false);
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

const DangerZone = ({ autoSave }: { autoSave: boolean }) => {
	useTitleBar({
		title: "Danger Zone",
	});
	return (
		<div className="row">
			<div className="col-md-6">
				<h2>Skip to...</h2>

				<p className="alert alert-danger">
					<b>Warning!</b> Skipping ahead might break your league! It's only here
					in case your league is already broken, in which case sometimes these
					drastic measures might save it.
				</p>

				<div className="btn-group mb-3">
					<button
						type="button"
						className="btn btn-light-bordered"
						onClick={() => {
							toWorker("toolsMenu", "skipToPlayoffs");
						}}
					>
						Playoffs
					</button>
					<button
						type="button"
						className="btn btn-light-bordered"
						onClick={() => {
							toWorker("toolsMenu", "skipToBeforeDraft");
						}}
					>
						Before draft
					</button>
					<button
						type="button"
						className="btn btn-light-bordered"
						onClick={() => {
							toWorker("toolsMenu", "skipToAfterDraft");
						}}
					>
						After draft
					</button>
					<button
						type="button"
						className="btn btn-light-bordered"
						onClick={() => {
							toWorker("toolsMenu", "skipToPreseason");
						}}
					>
						Preseason
					</button>
				</div>
			</div>
			<div className="col-md-6">
				<h2>Auto save</h2>

				<p>
					By default, your league is automatically saved as you play. Usually
					this is what you want. But sometimes you might want to experiment with
					re-playing parts of the game multiple times. When your league is saved
					automatically, you can't easily do that.
				</p>
				<p>
					To enable that kind of experimentation, here you can disable auto
					saving. This is not well tested and could break things, but it seems
					to generally work.
				</p>
				<p>
					If you play enough seasons with auto saving disabled, things will get
					slow because it has to keep everything in memory. But within a single
					season, disabling auto saving will actually make things faster.
				</p>

				<p>
					This setting is only temporary. If you restart your browser or switch
					to another league, auto save will be enabled again.
				</p>

				<p className="alert alert-danger">
					<b>Warning!</b> Once you disable auto save, you will not be awarded
					any achievements for this league, even after re-enabling auto save.
				</p>

				<AutoSave autoSave={autoSave} />
			</div>
		</div>
	);
};

export default DangerZone;
