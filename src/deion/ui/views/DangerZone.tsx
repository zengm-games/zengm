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
				<button
					className="btn btn-light-bordered"
					disabled={processing}
					onClick={async () => {
						setProcessing(true);
						await toWorker("main", "setLocal", "autoSave", true);
						setAutoSaveTemp(true);
						setProcessing(false);
					}}
				>
					Enable auto save
				</button>
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
					<b className="text-info">How to restore to your previous save:</b> The
					easiest way is to switch to another league and then switch back to
					this league. When you do this and load your previous save, auto save
					will be enabled until you manually disable it again.
				</p>

				<p>
					<b className="text-info">
						How to save things that happened with auto save disabled:
					</b>{" "}
					Just come back here and click "Enable auto save".
				</p>

				<AutoSave autoSave={autoSave} />
			</div>
		</div>
	);
};

export default DangerZone;
