import PropTypes from "prop-types";
import React, { useState, FormEvent, ChangeEvent } from "react";
import { DIFFICULTY } from "../../common";
import { HelpPopover } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { helpers, logEvent, toWorker } from "../util";
import Options from "./Options";
import type { View } from "../../common/types";

const difficultyValues = Object.values(DIFFICULTY);

const LeagueOptions = (props: View<"leagueOptions">) => {
	const [state, setState] = useState({
		autoDeleteOldBoxScores: String(props.autoDeleteOldBoxScores),
		difficulty: String(props.difficulty),
		difficultySelect: difficultyValues.includes(props.difficulty)
			? String(props.difficulty)
			: "custom",
		stopOnInjury: String(props.stopOnInjury),
		stopOnInjuryGames: String(props.stopOnInjuryGames),
	});

	const handleChange = (name: string) => (
		event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const value = event.target.value;
		setState(state2 => ({
			...state2,
			[name]: value,
		}));
	};

	const handleFormSubmit = async (event: FormEvent) => {
		event.preventDefault();

		const attrs: any = {
			autoDeleteOldBoxScores: state.autoDeleteOldBoxScores === "true",
			difficulty: parseFloat(state.difficulty),
			stopOnInjury: state.stopOnInjury === "true",
			stopOnInjuryGames: parseInt(state.stopOnInjuryGames, 10),
		};
		if (attrs.difficulty <= DIFFICULTY.Easy) {
			attrs.easyDifficultyInPast = true;
		}

		await toWorker("main", "updateGameAttributes", attrs);

		logEvent({
			type: "success",
			text: "Options successfully updated.",
			saveToDb: false,
		});
	};

	useTitleBar({ title: "Options" });

	const disableDifficultyInput =
		state.difficultySelect !== "custom" &&
		difficultyValues.includes(parseFloat(state.difficulty));

	return (
		<>
			<h2>League Options</h2>

			<form onSubmit={handleFormSubmit} className="mb-5">
				<div className="row">
					<div className="col-sm-3 col-6 form-group">
						<label htmlFor="options-auto-delete-box-scores">
							Auto Delete Old Box Scores
						</label>
						<HelpPopover title="Auto Delete Old Box Scores" className="ml-1">
							This will automatically delete box scores older than the past
							three seasons because box scores use a lot of disk space. See{" "}
							<a href={helpers.leagueUrl(["delete_old_data"])}>
								Delete Old Data
							</a>{" "}
							for more.
						</HelpPopover>
						<select
							id="options-auto-delete-box-scores"
							className="form-control"
							onChange={handleChange("autoDeleteOldBoxScores")}
							value={state.autoDeleteOldBoxScores}
						>
							<option value="true">Enabled</option>
							<option value="false">Disabled</option>
						</select>
					</div>
					<div className="col-sm-3 col-6 form-group">
						<label htmlFor="options-stop-on-injury">
							Stop On Injury Longer Than
						</label>
						<HelpPopover title="Stop On Injury Longer Than" className="ml-1">
							This will stop game simulation if one of your players is injured
							for more than N games. In auto play mode (Tools &gt; Auto Play
							Seasons), this has no effect.
						</HelpPopover>
						<select
							id="options-stop-on-injury"
							className="form-control"
							onChange={handleChange("stopOnInjury")}
							value={state.stopOnInjury}
						>
							<option value="true">Enabled</option>
							<option value="false">Disabled</option>
						</select>
						<div className="input-group mt-2">
							<input
								type="text"
								className="form-control"
								disabled={state.stopOnInjury === "false"}
								onChange={handleChange("stopOnInjuryGames")}
								value={state.stopOnInjuryGames}
							/>
							<div className="input-group-append">
								<div className="input-group-text">Games</div>
							</div>
						</div>
					</div>
					<div className="col-sm-3 col-6 form-group">
						<label htmlFor="options-difficulty">Difficulty</label>
						<HelpPopover title="Difficulty" className="ml-1">
							<p>
								Increasing difficulty makes AI teams more reluctant to trade
								with you, makes players less likely to sign with you, and makes
								it harder to turn a profit.
							</p>
							<p>
								If you set the difficulty to Easy, you will not get credit for
								any <a href="/account">Achievements</a>. This persists even if
								you switch to a harder difficulty.
							</p>
						</HelpPopover>
						<select
							id="options-difficulty"
							className="form-control"
							onChange={event => {
								handleChange("difficultySelect")(event);
								if (event.target.value !== "custom") {
									handleChange("difficulty")(event);
								}
							}}
							value={state.difficultySelect}
						>
							{Object.entries(DIFFICULTY).map(([text, numeric]) => (
								<option key={numeric} value={numeric}>
									{text}
								</option>
							))}
							<option value="custom">Custom</option>
						</select>
						<div className="input-group mt-2">
							<input
								type="text"
								className="form-control"
								disabled={disableDifficultyInput}
								onChange={handleChange("difficulty")}
								value={state.difficulty}
							/>
						</div>
					</div>
				</div>

				<button className="btn btn-primary">Save League Options</button>
			</form>

			<Options title="Global Options" {...props.globalOptions} />
		</>
	);
};

LeagueOptions.propTypes = {
	autoDeleteOldBoxScores: PropTypes.bool.isRequired,
	difficulty: PropTypes.number.isRequired,
	stopOnInjury: PropTypes.bool.isRequired,
	stopOnInjuryGames: PropTypes.number.isRequired,
};

export default LeagueOptions;
