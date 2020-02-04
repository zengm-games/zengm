import React from "react";
import useTitleBar from "../hooks/useTitleBar";
import { toWorker } from "../util";

const DangerZone = () => {
	useTitleBar({
		title: "Danger Zone",
	});
	return (
		<>
			<p className="alert alert-danger">
				<b>Warning!</b> This stuff might break your league! It's only here in
				case your league is already broken, in which case sometimes these
				drastic measures might save it.
			</p>

			<p>
				<button
					type="button"
					className="btn btn-danger"
					onClick={() => {
						toWorker("toolsMenu", "skipToPlayoffs");
					}}
				>
					Skip To Playoffs
				</button>
			</p>
			<p>
				<button
					type="button"
					className="btn btn-danger"
					onClick={() => {
						toWorker("toolsMenu", "skipToBeforeDraft");
					}}
				>
					Skip To Before Draft
				</button>
			</p>
			<p>
				<button
					type="button"
					className="btn btn-danger"
					onClick={() => {
						toWorker("toolsMenu", "skipToAfterDraft");
					}}
				>
					Skip To After Draft
				</button>
			</p>
			<p>
				<button
					type="button"
					className="btn btn-danger"
					onClick={() => {
						toWorker("toolsMenu", "skipToPreseason");
					}}
				>
					Skip To Preseason
				</button>
			</p>
		</>
	);
};

export default DangerZone;
