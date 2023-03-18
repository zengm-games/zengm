import { useState, type ChangeEvent, type FormEvent } from "react";
import useTitleBar from "../../hooks/useTitleBar";
import { helpers, logEvent, safeLocalStorage, toWorker } from "../../util";
import RealData from "./RealData";
import Storage from "./Storage";
import type { View } from "../../../common/types";
import {
	DEFAULT_PHASE_CHANGE_REDIRECTS,
	isSport,
	PHASE,
	PHASE_TEXT,
} from "../../../common";
import { HelpPopover, MoreLinks } from "../../components";

const GlobalSettings = (props: View<"globalSettings">) => {
	const [state, setState] = useState(() => {
		const themeLocalStorage = safeLocalStorage.getItem("theme");
		let theme: "dark" | "light" | "default";
		if (themeLocalStorage === "dark") {
			theme = "dark";
		} else if (themeLocalStorage === "light") {
			theme = "light";
		} else {
			theme = "default";
		}

		let units: "metric" | "us" | "default";
		if (props.units === "metric") {
			units = "metric";
		} else if (props.units === "us") {
			units = "us";
		} else {
			units = "default";
		}

		const fullNames = props.fullNames ? "always" : ("abbrev-small" as const);

		return {
			fullNames,
			phaseChangeRedirects: props.phaseChangeRedirects,
			realPlayerPhotos: props.realPlayerPhotos,
			realTeamInfo: props.realTeamInfo,
			theme,
			units,
		};
	});

	const handleChange =
		(name: string) =>
		(event: ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
			const value = event.target.value;
			setState(state2 => ({
				...state2,
				[name]: value,
			}));
		};

	const handleFormSubmit = async (event: FormEvent) => {
		event.preventDefault();

		if (state.theme === "default") {
			safeLocalStorage.removeItem("theme");
		} else {
			safeLocalStorage.setItem("theme", state.theme);
		}
		if (window.themeCSSLink) {
			window.themeCSSLink.href = `/gen/${window.getTheme()}.css`;
		}

		const units = state.units === "default" ? undefined : state.units;
		try {
			await toWorker("main", "updateOptions", {
				fullNames: state.fullNames === "always",
				phaseChangeRedirects: state.phaseChangeRedirects,
				realPlayerPhotos: state.realPlayerPhotos,
				realTeamInfo: state.realTeamInfo,
				units,
			});
			logEvent({
				type: "success",
				text: "Settings successfully updated.",
				saveToDb: false,
			});
		} catch (error) {
			logEvent({
				type: "error",
				text: error.message,
				saveToDb: false,
				persistent: true,
			});
		}
	};

	useTitleBar({ title: "Global Settings" });

	const phaseChangeRedirects = DEFAULT_PHASE_CHANGE_REDIRECTS.map(phase => {
		let label;
		if (phase === PHASE.REGULAR_SEASON) {
			label = "Season preview, before regular season";
		} else if (phase === PHASE.DRAFT_LOTTERY) {
			label = "Season summary, after playoffs";
		} else {
			label = helpers.upperCaseFirstLetter(PHASE_TEXT[phase]);
		}

		return {
			phase,
			label,
			checked: state.phaseChangeRedirects.includes(phase),
		};
	});

	return (
		<>
			<MoreLinks type="globalSettings" page="/settings" />

			<form onSubmit={handleFormSubmit}>
				<div className="row">
					<div className="col-sm-3 col-6 mb-3">
						<label className="form-label" htmlFor="options-color-scheme">
							Color Scheme
						</label>
						<select
							id="options-color-scheme"
							className="form-select"
							onChange={handleChange("theme")}
							value={state.theme}
						>
							<option value="default">Auto</option>
							<option value="light">Light</option>
							<option value="dark">Dark</option>
						</select>
					</div>
					<div className="col-sm-3 col-6 mb-3">
						<label className="form-label" htmlFor="options-units">
							Units
						</label>
						<select
							id="options-units"
							className="form-select"
							onChange={handleChange("units")}
							value={state.units}
						>
							<option value="default">Auto</option>
							<option value="us">US</option>
							<option value="metric">Metric</option>
						</select>
					</div>
					<div className="col-sm-3 col-6 mb-3">
						<label className="form-label" htmlFor="options-fullNames">
							Player Name Display
						</label>
						<select
							id="options-fullNames"
							className="form-select"
							onChange={handleChange("fullNames")}
							value={state.fullNames}
						>
							<option value="abbrev-small">
								Abbreviate first names and skills on small screens
							</option>
							<option value="always">Always show full names and skills</option>
						</select>
					</div>
					<div className="col-sm-3 col-6 mb-3">
						<label className="form-label">
							Auto UI Redirect{" "}
							<HelpPopover title="Auto UI Redirect">
								<p>
									At different points in the game, the UI automatically
									redirects to a page. For example, when the regular season
									ends, it automatically redirects to the playoff bracket. If
									you find that behavior annoying, you can disable it here.
								</p>
							</HelpPopover>
						</label>
						{phaseChangeRedirects.map(({ checked, label, phase }) => (
							<div key={phase} className="form-check">
								<input
									className="form-check-input"
									type="checkbox"
									id={`options-phaseChangeRedirects-${phase}`}
									checked={checked}
									onChange={() => {
										let phaseChangeRedirects;
										if (checked) {
											phaseChangeRedirects = state.phaseChangeRedirects.filter(
												phase2 => phase2 !== phase,
											);
										} else {
											phaseChangeRedirects = [
												...state.phaseChangeRedirects,
												phase,
											];
										}

										setState({
											...state,
											phaseChangeRedirects,
										});
									}}
								/>
								<label
									className="form-check-label"
									htmlFor={`options-phaseChangeRedirects-${phase}`}
								>
									{label}
								</label>
							</div>
						))}
						<div className="mt-1">
							<button
								className="btn btn-link p-0"
								type="button"
								onClick={() => {
									setState({
										...state,
										phaseChangeRedirects: DEFAULT_PHASE_CHANGE_REDIRECTS,
									});
								}}
							>
								All
							</button>{" "}
							|{" "}
							<button
								className="btn btn-link p-0"
								type="button"
								onClick={() => {
									setState({
										...state,
										phaseChangeRedirects: [],
									});
								}}
							>
								None
							</button>
						</div>
					</div>
					<div className="col-sm-3 col-6 mb-3">
						<label className="form-label">Persistent Storage</label>
						<Storage />
					</div>
				</div>

				{isSport("basketball") ? (
					<>
						<h2>Team and Player Data for "Real Players" Leagues</h2>
						<RealData
							handleChange={handleChange}
							realPlayerPhotos={state.realPlayerPhotos}
							realTeamInfo={state.realTeamInfo}
						/>
					</>
				) : null}

				<button className="btn btn-primary mt-3">Save Global Settings</button>
			</form>
		</>
	);
};

export default GlobalSettings;
