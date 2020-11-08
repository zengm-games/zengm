import PropTypes from "prop-types";
import React, { useState, FormEvent, ChangeEvent } from "react";
import { DIFFICULTY } from "../../common";
import { HelpPopover } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { logEvent, toWorker } from "../util";
import type { View } from "../../common/types";

const LeagueOptions = (props: View<"leagueOptions">) => {
	const [state, setState] = useState({
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

	return (
		<>
			<h2>League Options</h2>

			<form onSubmit={handleFormSubmit} className="mb-5">
				<div className="row">
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
				</div>

				<button className="btn btn-primary">Save League Options</button>
			</form>
		</>
	);
};

LeagueOptions.propTypes = {
	stopOnInjury: PropTypes.bool.isRequired,
	stopOnInjuryGames: PropTypes.number.isRequired,
};

export default LeagueOptions;
