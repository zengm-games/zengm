import useTitleBar from "../hooks/useTitleBar.tsx";
import { GAME_ACRONYM, GAME_NAME } from "../../common/index.ts";
import { useEffect, useState } from "react";
import ActionButton from "../components/ActionButton.tsx";
import toWorker from "../util/toWorker.ts";

const Upgrade65 = () => {
	useTitleBar({
		title: "Upgrade Database to Version 65",
	});

	const [state, setState] = useState<
		| {
				type: "init" | "upgrading" | "done";
		  }
		| {
				type: "error";
				error: Error;
		  }
	>({
		type: "init",
	});

	const [estimate, setEstimate] = useState("(loading time estimate...)");

	useEffect(() => {
		(async () => {
			const { numFeats, numPlayoffSeries } = await toWorker(
				"main",
				"upgrade65Estimate",
				undefined,
			);
			let timeText;
			const numSeconds = ((numPlayoffSeries + numFeats) * 1.5) / 1000;
			if (numSeconds <= 10) {
				timeText = "just a few seconds";
			} else if (numSeconds <= 60) {
				timeText = "under a minute";
			} else if (numSeconds <= 59 * 60) {
				timeText = `${(numSeconds / 60).toFixed(1)} minutes`;
			} else {
				timeText = `${(numSeconds / 60 / 60).toFixed(1)} hours`;
			}

			setEstimate(timeText);
		})();
	}, []);

	return (
		<>
			<p>
				In May 2025, an update to {GAME_NAME} added a new "Save Old Box Scores"
				feature which gives you some control over which box scores get
				automatically deleted after some time, and which don't. Two of the new
				options require some ugprades to the database to work correctly for
				existing box scores, which can be slow in leagues with many seasons.
				Thise features are:
			</p>
			<ul>
				<li>Saving box scores from finals games</li>
				<li>Saving box scores from games with statistical feats</li>
			</ul>
			<p className="text-success">
				If you don't want to use those features to save box scores from before
				this update, then you don't need to do anything!
			</p>
			<p>
				But if you do, then the database needs to be upgraded. It tries to
				automatically do that when updating to the new version of {GAME_ACRONYM}{" "}
				but if it's too slow it stops and gives you a link to this page.
			</p>
			<p>
				Click the button below to perform the database upgrade. As a very rough
				estimate, this should take about{" "}
				<span className="fw-bold">{estimate}</span> to complete.
			</p>
			<ActionButton
				onClick={async () => {
					try {
						setState({
							type: "upgrading",
						});

						await toWorker("main", "upgrade65", undefined);

						setState({
							type: "done",
						});
					} catch (error) {
						setState({
							type: "error",
							error,
						});
					}
				}}
				processing={state.type === "upgrading"}
				processingText="Upgrading"
				size="lg"
			>
				Upgrade database
			</ActionButton>
			<div className="mt-3">
				{state.type === "done" ? (
					<div className="alert alert-success d-inline-block">
						Upgrade complete!
					</div>
				) : null}
				{state.type === "error" ? (
					<div className="alert alert-danger d-inline-block">
						<b>Error:</b> {state.error.message}
					</div>
				) : null}
			</div>
		</>
	);
};

export default Upgrade65;
