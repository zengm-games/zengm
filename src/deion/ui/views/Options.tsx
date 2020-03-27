import classNames from "classnames";
import PropTypes from "prop-types";
import React, {
	useCallback,
	useEffect,
	useState,
	ChangeEvent,
	FormEvent,
} from "react";
import useTitleBar from "../hooks/useTitleBar";
import { helpers, logEvent, toWorker } from "../util";
import { View } from "../../common/types";

const Storage = () => {
	const [status, setStatus] = useState<
		| "enabled"
		| "disabled"
		| "failed"
		| "loading..."
		| "not supported by your browser"
	>("loading...");

	useEffect(() => {
		const check = async () => {
			if (navigator.storage && navigator.storage.persisted) {
				const persisted = await navigator.storage.persisted();
				if (persisted) {
					setStatus("enabled");
				} else {
					setStatus("disabled");
				}
			} else {
				setStatus("not supported by your browser");
			}
		};

		check();
	}, []);

	const onClick = useCallback(async event => {
		event.preventDefault();

		if (navigator.storage && navigator.storage.persist) {
			setStatus("loading...");

			const persisted = await navigator.storage.persist();
			if (persisted) {
				setStatus("enabled");
			} else {
				// https://stackoverflow.com/questions/51657388/request-persistent-storage-permissions
				setStatus("failed");
			}
		} else {
			setStatus("not supported by your browser");
		}
	}, []);

	return (
		<>
			<p>
				Since {helpers.upperCaseFirstLetter(process.env.SPORT)} GM stores game
				data in your browser profile,{" "}
				<a href="https://basketball-gm.com/manual/faq/#missing-leagues">
					sometimes it can be inadvertently deleted
				</a>
				. Enabling persistent storage helps protect against this.
			</p>
			<p>
				Status:{" "}
				<span
					className={classNames({
						"text-success": status === "enabled",
						"text-danger": status === "disabled" || status === "failed",
					})}
				>
					{status}
				</span>
			</p>
			{status === "failed" ? (
				<p>
					Sorry, this feature can be tricky to get working in some browsers. If
					you bookmark this page, it might work if you press "Enable" again.
					Otherwise, check back later after playing more and maybe it will work.
				</p>
			) : null}
			{status === "loading..." ||
			status === "disabled" ||
			status === "failed" ? (
				<button
					className="btn btn-light-bordered"
					disabled={status === "loading..."}
					onClick={onClick}
				>
					Enable
				</button>
			) : null}
		</>
	);
};

// Props are not from View<> because they are only ever passed from LeagueOptions
const Options = (props: View<"options"> & { title?: string }) => {
	const [state, setState] = useState(() => {
		const themeLocalStorage = localStorage.getItem("theme");
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
			theme,
			units,
		};
	});

	const handleChange = (name: string) => (
		event: ChangeEvent<HTMLSelectElement>,
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
			localStorage.removeItem("theme");
		} else {
			localStorage.setItem("theme", state.theme);
		}
		if (window.themeCSSLink) {
			window.themeCSSLink.href = `/gen/${window.getTheme()}.css`;
		}

		const units = state.units === "default" ? undefined : state.units;
		await toWorker("main", "updateOptions", { units });

		logEvent({
			type: "success",
			text: "Options successfully updated.",
			saveToDb: false,
		});
	};

	const title = props.title ? props.title : "Options";

	useTitleBar({ title: "Options" });

	return (
		<>
			{props.title ? <h2>{title}</h2> : null}

			<form onSubmit={handleFormSubmit}>
				<div className="row">
					<div className="col-sm-3 col-6 form-group">
						<label>Color Scheme</label>
						<select
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
						<label>Units</label>
						<select
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

				<button className="btn btn-primary">Save {title}</button>
			</form>
		</>
	);
};

Options.propTypes = {
	title: PropTypes.string,
};

export default Options;
