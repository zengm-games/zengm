import PropTypes from "prop-types";
import React, { useCallback } from "react";
import { PHASE } from "../../common";
import useTitleBar from "../hooks/useTitleBar";
import { toWorker } from "../util";

const MultiTeamMode = ({ phase, teams, userTid, userTids }) => {
	const handleChange = useCallback(
		async e => {
			const newUserTids = Array.from(e.target.options)
				.filter(o => o.selected)
				.map(o => parseInt(o.value, 10))
				.filter(n => !Number.isNaN(n));

			if (newUserTids.length < 1) {
				return;
			}

			if (JSON.stringify(newUserTids) !== JSON.stringify(userTids)) {
				const gameAttributes = { userTids: newUserTids };
				if (!newUserTids.includes(userTid)) {
					gameAttributes.userTid = newUserTids[0];
				}

				await toWorker("updateMultiTeamMode", gameAttributes);
			}
		},
		[userTid, userTids],
	);

	const handleDisable = useCallback(async () => {
		await toWorker("updateMultiTeamMode", {
			userTids: [userTid],
		});
	}, [userTid]);

	useTitleBar({ title: "Multi Team Mode" });

	if (phase === PHASE.RESIGN_PLAYERS) {
		return (
			<div>
				<h1>Error</h1>
				<p>
					Changing your teams while re-signing players currently breaks things.
					Please play until free agency and then you can switch teams.
				</p>
			</div>
		);
	}

	let statusText;
	if (userTids.length === 1) {
		statusText = (
			<span>
				<b className="text-danger">Multi team mode disabled!</b> To enable it,
				select all the teams you want to control below.
			</span>
		);
	} else if (userTids.length > 1) {
		statusText = (
			<span>
				<b className="text-success">Multi team mode enabled!</b> To disable it,
				unselect all but one team or click the button below.
			</span>
		);
	} else {
		statusText = (
			<span>
				<b className="text-danger">Error!</b> Select at least one team!
			</span>
		);
	}

	return (
		<>
			<p>
				Here you can switch from controlling one team to controlling multiple
				teams. Why would you want to do this? A few reasons I can think of:
			</p>

			<ul>
				<li>
					Live in-person multiplayer - two people sharing one computer can play
					in the same league together
				</li>
				<li>
					Extreme control - if you want to control how other teams behave, for
					some reason
				</li>
				<li>
					Online multiplayer - if you want to run a league where you are the
					commissioner and other people email you roster moves to make manually,
					you don't want AI fucking things up
				</li>
			</ul>

			<p>
				For more details,{" "}
				<a href="https://basketball-gm.com/blog/2015/03/new-feature-multi-team-mode/">
					read this blog post
				</a>
				. But basically,{" "}
				<a href="https://www.youtube.com/watch?v=4kly-bxCBZg">
					multi til the motherfucking sun die
				</a>
				.
			</p>

			<p>
				{statusText} Use shift+click to select adjacent teams, or ctrl+click
				(command+click on Mac) to select individual teams.
			</p>

			{userTids.length > 1 ? (
				<button
					type="button"
					className="btn btn-danger mb-3"
					onClick={handleDisable}
				>
					Disable multi-team mode
				</button>
			) : null}

			<div className="row">
				<div className="col-sm-6">
					<select
						className="form-control"
						multiple
						onChange={handleChange}
						size={teams.length}
						value={userTids.map(String)}
					>
						{teams.map(t => (
							<option key={t.tid} value={t.tid}>
								{t.name}
							</option>
						))}
					</select>
				</div>
			</div>
		</>
	);
};

MultiTeamMode.propTypes = {
	phase: PropTypes.number.isRequired,
	teams: PropTypes.arrayOf(
		PropTypes.shape({
			name: PropTypes.string.isRequired,
			tid: PropTypes.number.isRequired,
		}),
	).isRequired,
	userTid: PropTypes.number.isRequired,
	userTids: PropTypes.arrayOf(PropTypes.number).isRequired,
};

export default MultiTeamMode;
