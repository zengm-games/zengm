import { useCallback, ChangeEvent, useRef } from "react";
import { bySport, isSport, PHASE } from "../../common";
import useTitleBar from "../hooks/useTitleBar";
import { toWorker, logEvent, helpers } from "../util";
import type { View } from "../../common/types";
import orderBy from "lodash-es/orderBy";

const handleAutoSort = async (tids: number[]) => {
	await toWorker("main", "autoSortRoster", { tids });
};

const handleResetPT = async (tids: number[]) => {
	await toWorker("main", "resetPlayingTime", tids);
};

const MultiTeamMode = ({
	godMode,
	phase,
	teams,
	userTid,
	userTids,
}: View<"multiTeamMode">) => {
	const notificationShown = useRef(false);

	const showNotification = () => {
		if (!notificationShown.current) {
			notificationShown.current = true;
			logEvent({
				saveToDb: false,
				text: "Switch between teams you control using the menu below:",
				type: "info",
			});
		}
	};

	const handleChange = useCallback(
		async (event: ChangeEvent<HTMLSelectElement>) => {
			const newUserTids = Array.from(event.target.options)
				.filter(o => o.selected)
				.map(o => parseInt(o.value))
				.filter(n => !Number.isNaN(n));

			if (newUserTids.length < 1) {
				return;
			}

			if (JSON.stringify(newUserTids) !== JSON.stringify(userTids)) {
				const gameAttributes: {
					userTids: number[];
					userTid?: number;
				} = { userTids: newUserTids };
				if (!newUserTids.includes(userTid)) {
					gameAttributes.userTid = newUserTids[0];
				}

				await toWorker("main", "updateMultiTeamMode", gameAttributes);

				if (newUserTids.length > 1) {
					showNotification();
				}
			}
		},
		[userTid, userTids],
	);

	useTitleBar({ title: "Multi Team Mode" });

	if (!godMode) {
		return (
			<div>
				<h2>Error</h2>
				<p>
					You cannot switch to a new team now unless you enable{" "}
					<a href={helpers.leagueUrl(["god_mode"])}>God Mode</a>.
				</p>
			</div>
		);
	}

	if (phase === PHASE.RESIGN_PLAYERS) {
		return (
			<div>
				<h2>Error</h2>
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
				teams. Why would you want to do this? Here's a few reasons:
			</p>

			<ul>
				<li>Extreme control - if you want to control how other teams behave</li>
				<li>
					Live in-person multiplayer - two people sharing one computer can play
					in the same league together
				</li>
				<li>
					<a href="https://www.reddit.com/r/BasketballGM/wiki/basketball_gm_multiplayer_league_list">
						Online multiplayer
					</a>{" "}
					- a bunch of people coordinate on Discord/Reddit/etc to run a whole
					league of teams, and then one person manually controls all the teams
					in the game
				</li>
			</ul>

			<p>
				{statusText} Use shift+click to select adjacent teams, or ctrl+click
				(command+click on Mac) to select individual teams.
			</p>

			<div className="btn-group mb-3">
				<button
					type="button"
					className="btn btn-light-bordered"
					onClick={async () => {
						await toWorker("main", "updateMultiTeamMode", {
							userTids: teams.map(t => t.tid),
						});
						showNotification();
					}}
				>
					Select all
				</button>
				{userTids.length > 1 ? (
					<button
						type="button"
						className="btn btn-danger"
						onClick={async () => {
							await toWorker("main", "updateMultiTeamMode", {
								userTids: [userTid],
							});
						}}
					>
						Disable multi team mode
					</button>
				) : null}
			</div>

			<div className="row">
				<div className="col-sm-6">
					<select
						className="form-select"
						multiple
						onChange={handleChange}
						size={teams.length}
						value={userTids.map(String)}
					>
						{orderBy(teams, ["region", "name", "tid"]).map(t => (
							<option key={t.tid} value={t.tid}>
								{t.region} {t.name}
							</option>
						))}
					</select>
				</div>
			</div>

			<h1 className="mt-3">Multi Team Controls</h1>

			<p>
				These actions will apply to all teams controlled by multi team mode.
			</p>

			<div className="btn-group">
				<button
					className="btn btn-light-bordered"
					onClick={() => handleAutoSort(userTids)}
				>
					Auto sort {bySport({ football: "depth charts", default: "rosters" })}
				</button>
				{isSport("basketball") ? (
					<button
						className="btn btn-light-bordered"
						onClick={() => handleResetPT(userTids)}
					>
						Reset playing time
					</button>
				) : null}
			</div>
		</>
	);
};

export default MultiTeamMode;
