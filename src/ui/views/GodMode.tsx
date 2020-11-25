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
		<>
			<p>
				God Mode is a collection of customization features that allow you to
				kind of do whatever you want. If you enable God Mode, you get access to
				the following features (which show up in the UI as{" "}
				<span className="god-mode god-mode-text">purple</span>
				):
			</p>

			<ul>
				<li>
					Customize tons of options at{" "}
					<a href={helpers.leagueUrl(["settings"])}>
						Tools &gt; League Settings
					</a>
				</li>
				<li>
					Create custom players by going to{" "}
					<a href={helpers.leagueUrl(["customize_player"])}>
						Tools &gt; Create A Player
					</a>
				</li>
				<li>
					Edit any player by going to their player page and clicking Edit Player
				</li>
				<li>
					Force any trade to be accepted by checking the Force Trade checkbox
					before proposing a trade
				</li>
				<li>
					You can become the GM of another team at any time with{" "}
					<a href={helpers.leagueUrl(["new_team"])}>Tools &gt; Switch Team</a>
				</li>
				<li>
					Add, remove and edit teams with{" "}
					<a href={helpers.leagueUrl(["manage_teams"])}>
						Tools &gt; Manage Teams
					</a>
				</li>
				<li>You will never be fired!</li>
			</ul>

			<p>
				However, if you enable God Mode within a league, you will not get credit
				for any <a href="/account">Achievements</a>. This persists even if you
				disable God Mode. You can only get Achievements in a league where God
				Mode has never been enabled.
			</p>

			<button
				className={classNames(
					"btn border-0",
					godMode ? "btn-success" : "btn-god-mode",
				)}
				onClick={handleGodModeToggle}
			>
				{godMode ? "Disable God Mode" : "Enable God Mode"}
			</button>

			<div>
				<p className="alert alert-info mt-3 d-inline-block">
					The additional settings that used to be here are now available at{" "}
					<a href={helpers.leagueUrl(["settings"])}>
						Tools &gt; League Settings
					</a>
					.
				</p>
			</div>
		</>
	);
};

export default GodMode;
