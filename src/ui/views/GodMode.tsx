import classNames from "classnames";
import React from "react";
import useTitleBar from "../hooks/useTitleBar";
import { helpers, localActions, toWorker } from "../util";
import type { View } from "../../common/types";

const GodMode = (props: View<"godMode">) => {
	const { godMode } = props;

	useTitleBar({ title: "God Mode" });

	const handleGodModeToggle = async () => {
		const attrs: {
			godMode: boolean;
			godModeInPast?: true;
		} = { godMode: !godMode };

		if (attrs.godMode) {
			attrs.godModeInPast = true;
		}

		await toWorker("main", "updateGameAttributes", attrs);
		localActions.update({ godMode: attrs.godMode });
	};
	return (
		<div style={{ maxWidth: 1100 }}>
			<p>
				God Mode is a collection of powerful customization features that give
				you more control over your league. These features show up in the UI in{" "}
				<span className="god-mode god-mode-text">purple</span>.
			</p>

			<p className="text-danger">
				If you enable God Mode within a league, you will not get credit for any{" "}
				<a href="/account">Achievements</a>. This persists even if you disable
				God Mode. You can only get Achievements in a league where God Mode has
				never been enabled.
			</p>

			<button
				className={classNames(
					"btn btn-lg border-0",
					godMode ? "btn-success" : "btn-god-mode",
				)}
				onClick={handleGodModeToggle}
			>
				{godMode ? "Disable God Mode" : "Enable God Mode"}
			</button>

			<div className="card-group mt-3">
				<div className="card border-radius-bottom-sm-0">
					<div className="card-body">
						<h3 className="card-title">Advanced Settings</h3>
						<p className="card-text">
							Customize tons of options at{" "}
							<a href={helpers.leagueUrl(["settings"])}>
								Tools &gt; League Settings
							</a>
							.
						</p>
					</div>
				</div>
				<div className="card border-radius-bottom-sm-0">
					<div className="card-body">
						<h3 className="card-title">Customize Players</h3>
						<p className="card-text">
							Create custom players by going to{" "}
							<a href={helpers.leagueUrl(["customize_player"])}>
								Tools &gt; Create A Player
							</a>
							. You can also edit, delete, and clone existing players from their
							profile pages. Edit draft classes at{" "}
							<a href={helpers.leagueUrl(["draft_scouting"])}>
								Tools &gt; Draft &gt; Draft Scouting
							</a>
							. Import/export players between leagues at{" "}
							<a href={helpers.leagueUrl(["export_players"])}>
								Tools &gt; Import/Export Players
							</a>
							.
						</p>
					</div>
				</div>
				<div className="card border-radius-bottom-sm-0">
					<div className="card-body">
						<h3 className="card-title">Customize Teams</h3>
						<p className="card-text">
							Create, disable, and edit teams in your league at{" "}
							<a href={helpers.leagueUrl(["manage_teams"])}>
								Tools &gt; Manage Teams
							</a>
							. Do the same for divisions and conferenes at{" "}
							<a href={helpers.leagueUrl(["manage_confs"])}>
								Tools &gt; Manage Confs
							</a>
							.
						</p>
					</div>
				</div>
			</div>

			<div className="card-group">
				<div className="card border-top-sm-0 border-radius-top-sm-0">
					<div className="card-body">
						<h3 className="card-title">Control Other Teams</h3>
						<p className="card-text">
							You can become the GM of another team at any time by going to{" "}
							<a href={helpers.leagueUrl(["new_team"])}>
								Tools &gt; Switch Team
							</a>
							, or you can control multiple teams simultaneously at{" "}
							<a href={helpers.leagueUrl(["multi_team_mode"])}>
								Tools &gt; Multi Team Mode
							</a>
							.
						</p>
					</div>
				</div>
				<div className="card border-top-sm-0 border-radius-top-sm-0">
					<div className="card-body">
						<h3 className="card-title">Force Results</h3>
						<p className="card-text">
							Force any trade to go through by clicking the "Force Trade"
							checkbox on the <a href={helpers.leagueUrl(["trade"])}>Trade</a>{" "}
							page. Or really play God and pick which team will win a game
							before it happens, from either{" "}
							<a href={helpers.leagueUrl(["schedule"])}>Team &gt; Schedule</a>{" "}
							or the{" "}
							<a href={helpers.leagueUrl(["live"])}>Live Game Simulation</a>{" "}
							page.
						</p>
					</div>
				</div>
				<div className="card border-top-sm-0 border-radius-top-sm-0">
					<div className="card-body">
						<h3 className="card-title">Edit Awards</h3>
						<p className="card-text">
							Decide who should win any end-of-season awards at{" "}
							<a href={helpers.leagueUrl(["edit_awards"])}>
								Tools &gt; Edit Awards
							</a>
							.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default GodMode;
