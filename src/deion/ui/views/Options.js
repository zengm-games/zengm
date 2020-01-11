import classNames from "classnames";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useState } from "react";
import useTitleBar from "../hooks/useTitleBar";
import { helpers, logEvent } from "../util";

const Storage = () => {
	const [status, setStatus] = useState("loading...");

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
			setStatus("loading");

			const persisted = await navigator.storage.persist();
			if (persisted) {
				setStatus("enabled");
			} else {
				setStatus("disabled");
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
						"text-danger": status === "disabled",
					})}
				>
					{status}
				</span>
			</p>
			{status === "loading..." || status === "disabled" ? (
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

const Options = props => {
	const [state, setState] = useState(() => {
		const themeLocalStorage = localStorage.getItem("theme");
		return {
			theme: themeLocalStorage === "dark" ? "dark" : "light",
		};
	});

	const handleChange = name => event => {
		const value = event.target.value;
		setState(state2 => ({
			...state2,
			[name]: value,
		}));
	};

	const handleFormSubmit = async event => {
		event.preventDefault();

		const newTheme = state.theme === "dark" ? "dark" : "light";
		localStorage.setItem("theme", newTheme);
		if (window.themeCSSLink) {
			window.themeCSSLink.href = `/gen/${window.getTheme()}.css`;
		}

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
						<label>Theme</label>
						<select
							className="form-control"
							onChange={handleChange("theme")}
							value={state.theme}
						>
							<option value="light">Light</option>
							<option value="dark">Dark</option>
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
