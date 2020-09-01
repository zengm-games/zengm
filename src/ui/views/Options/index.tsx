import PropTypes from "prop-types";
import React, { useState, ChangeEvent, FormEvent } from "react";
import useTitleBar from "../../hooks/useTitleBar";
import { logEvent, safeLocalStorage, toWorker } from "../../util";
import RealData from "./RealData";
import Storage from "./Storage";
import type { View } from "../../../common/types";

// Props are not from View<> because they are only ever passed from LeagueOptions
const Options = (props: View<"options"> & { title?: string }) => {
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

		return {
			realPlayerPhotos: props.realPlayerPhotos,
			realTeamInfo: props.realTeamInfo,
			theme,
			units,
		};
	});

	const handleChange = (name: string) => (
		event: ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>,
	) => {
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
				realPlayerPhotos: state.realPlayerPhotos,
				realTeamInfo: state.realTeamInfo,
				units,
			});
			logEvent({
				type: "success",
				text: "Options successfully updated.",
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

	const title = props.title ? props.title : "Options";

	useTitleBar({ title: "Options" });

	return (
		<>
			{props.title ? <h2>{title}</h2> : null}

			<form onSubmit={handleFormSubmit}>
				<div className="row">
					<div className="col-sm-3 col-6 form-group">
						<label htmlFor="options-color-scheme">Color Scheme</label>
						<select
							id="options-color-scheme"
							className="form-control"
							onChange={handleChange("theme")}
							value={state.theme}
						>
							<option value="default">Auto</option>
							<option value="light">Light</option>
							<option value="dark">Dark</option>
						</select>
					</div>
					<div className="col-sm-3 col-6 form-group">
						<label htmlFor="options-units">Units</label>
						<select
							id="options-units"
							className="form-control"
							onChange={handleChange("units")}
							value={state.units}
						>
							<option value="default">Auto</option>
							<option value="us">US</option>
							<option value="metric">Metric</option>
						</select>
					</div>
					<div className="col-sm-3 col-6 form-group">
						<label>Persistent Storage</label>
						<Storage />
					</div>
				</div>

				{process.env.SPORT === "basketball" ? (
					<>
						{props.title ? (
							<h3>Team and Player Data for "Real Players" Leagues</h3>
						) : (
							<h2>Team and Player Data for "Real Players" Leagues</h2>
						)}
						<RealData
							handleChange={handleChange}
							realPlayerPhotos={state.realPlayerPhotos}
							realTeamInfo={state.realTeamInfo}
						/>
					</>
				) : null}

				<button className="btn btn-primary mt-3">Save {title}</button>
			</form>
		</>
	);
};

Options.propTypes = {
	title: PropTypes.string,
};

export default Options;
