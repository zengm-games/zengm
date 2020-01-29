import PropTypes from "prop-types";
import React from "react";
import { HelpPopover, RatingsStatsPopover } from "../../components";

const RelativesForm = ({
	handleChange,
	relatives,
}: {
	handleChange: (
		type: string,
		field: string,
		event: {
			target: {
				value: any;
			};
		},
	) => void;
	relatives: {
		name: string;
		pid: number | string;
		type: string;
	}[];
}) => {
	const handleRelativesChange = (
		index: number,
		field: "pid" | "type" | "add" | "delete",
		event?: any,
	) => {
		if (field === "delete") {
			relatives.splice(index, 1);
		} else if (field === "add") {
			relatives.push({
				name: "",
				pid: 0,
				type: "brother",
			});
		} else {
			// @ts-ignore
			relatives[index][field] = event.target.value;
		}
		handleChange("root", "relatives", {
			target: {
				value: relatives,
			},
		});
	};

	return (
		<>
			{relatives.map(({ pid, type }, i) => {
				return (
					<div className="d-flex align-items-end mb-3" key={i}>
						<div className="mr-3">
							{i === 0 ? <label>Type</label> : null}
							<select
								className="form-control"
								onChange={event => {
									handleRelativesChange(i, "type", event);
								}}
								value={type}
							>
								<option value="brother">Brother</option>
								<option value="father">Father</option>
								<option value="son">Son</option>
							</select>
						</div>
						<div className="mr-2">
							{i === 0 ? (
								<label>
									Player ID number{" "}
									<HelpPopover placement="bottom" title="Player ID number">
										<p>Enter the player ID number of the relative here.</p>
										<p>
											To find a player ID number, go to the player page for that
											player and look at the end of the URL. For instance, if
											the URL is https://play.
											{process.env.SPORT}
											-gm.com/l/19/player/6937, then the player ID number is
											6937.
										</p>
										<p>
											Ideally this would be a search box that would
											automatically find the ID number when you type in a
											player's name, but oh well.
										</p>
									</HelpPopover>
								</label>
							) : null}
							<input
								type="text"
								className="form-control"
								onChange={event => {
									handleRelativesChange(i, "pid", event);
								}}
								value={pid}
							/>
						</div>
						<div className="flex-shrink-0" style={{ fontSize: 20 }}>
							<RatingsStatsPopover pid={parseInt(pid as any, 10)} />
							<a
								className="ml-3 new_window text-danger"
								onClick={() => {
									handleRelativesChange(i, "delete");
								}}
								title="Delete"
							>
								<span className="glyphicon glyphicon-remove" />
							</a>
						</div>
					</div>
				);
			})}
			<button
				type="button"
				className="btn btn-secondary"
				onClick={() => {
					handleRelativesChange(-1, "add");
				}}
			>
				Add
			</button>
		</>
	);
};

RelativesForm.propTypes = {
	handleChange: PropTypes.func.isRequired,
	relatives: PropTypes.arrayOf(
		PropTypes.shape({
			pid: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
			type: PropTypes.oneOf(["brother", "father", "son"]).isRequired,
		}),
	).isRequired,
};

export default RelativesForm;
