import { useState } from "react";
import { isSport, PHASE, WEBSITE_ROOT } from "../../../common";
import type { View } from "../../../common/types";
import { ActionButton } from "../../components";
import useTitleBar from "../../hooks/useTitleBar";
import { helpers, logEvent, toWorker } from "../../util";
import AutoSave from "./AutoSave";
import WorkerConsole from "./WorkerConsole";

const DangerZone = ({
	autoSave,
	canRegenerateSchedule,
	godMode,
	phase,
}: View<"dangerZone">) => {
	useTitleBar({
		title: "Danger Zone",
	});

	const [regeneratingSchedule, setRegeneratingSchedule] = useState(false);

	return (
		<div className="row">
			<div className="col-md-6">
				<div className="mb-5">
					<h2>Regenerate schedule</h2>

					<p className={canRegenerateSchedule ? undefined : "text-warning"}>
						This can only be done at the start of the regular season, when no
						games have been played.
					</p>

					<ActionButton
						className="border-0"
						type="submit"
						variant="god-mode"
						disabled={!canRegenerateSchedule || regeneratingSchedule}
						processing={regeneratingSchedule}
						onClick={async () => {
							setRegeneratingSchedule(true);
							await toWorker("main", "regenerateSchedule", undefined);
							setRegeneratingSchedule(false);
						}}
					>
						Regenerate schedule
					</ActionButton>
				</div>

				<h2>Skip to...</h2>

				<p className="alert alert-danger">
					<b>Warning!</b> Skipping ahead might break your league! It's only here
					in case your league is already broken, in which case sometimes these
					drastic measures might save it.
				</p>

				<div className="btn-group mb-5">
					<button
						type="button"
						className="btn btn-light-bordered"
						onClick={() => {
							toWorker("toolsMenu", "skipToPlayoffs", undefined);
						}}
					>
						Playoffs
					</button>
					<button
						type="button"
						className="btn btn-light-bordered"
						onClick={() => {
							toWorker("toolsMenu", "skipToBeforeDraft", undefined);
						}}
					>
						Before draft
					</button>
					<button
						type="button"
						className="btn btn-light-bordered"
						onClick={() => {
							toWorker("toolsMenu", "skipToAfterDraft", undefined);
						}}
					>
						After draft
					</button>
					<button
						type="button"
						className="btn btn-light-bordered"
						onClick={() => {
							toWorker("toolsMenu", "skipToPreseason", undefined);
						}}
					>
						Preseason
					</button>
				</div>

				<h2>Trade deadline</h2>

				<p>
					This will not sim any games, it will just toggle whether the trade
					deadline has passed or not this season, and delete any scheduled trade
					deadline later this season.
				</p>

				{!godMode ? (
					<p className="text-warning">
						This feature is only available in{" "}
						<a href={helpers.leagueUrl(["god_mode"])}>God Mode</a>.
					</p>
				) : phase !== PHASE.REGULAR_SEASON &&
				  phase !== PHASE.AFTER_TRADE_DEADLINE ? (
					<p className="text-warning">
						This only works during the regular season.
					</p>
				) : null}

				{phase === PHASE.AFTER_TRADE_DEADLINE ? (
					<button
						type="button"
						className="btn btn-god-mode border-0"
						disabled={!godMode}
						onClick={() => {
							toWorker("main", "toggleTradeDeadline", undefined);
						}}
					>
						Switch to before trade deadline
					</button>
				) : (
					<button
						type="button"
						className="btn btn-god-mode border-0"
						disabled={phase !== PHASE.REGULAR_SEASON || !godMode}
						onClick={() => {
							toWorker("main", "toggleTradeDeadline", undefined);
						}}
					>
						Switch to after trade deadline
					</button>
				)}

				{isSport("basketball") ? (
					<div className="mt-5">
						<h2>All-Star Game</h2>

						<p>
							If the All-Star Game has not yet happened, you can move it up to
							right now, so that it will happen before the next currently
							scheduled game. This also works if the current season has no
							All-Star Game - it will add one, and it will happen before the
							next game.
						</p>

						<p>
							If the All-Star Game has already happened and you add another
							one... I guess you get an extra All-Star Game?
						</p>

						{!godMode ? (
							<p className="text-warning">
								This feature is only available in{" "}
								<a href={helpers.leagueUrl(["god_mode"])}>God Mode</a>.
							</p>
						) : phase !== PHASE.REGULAR_SEASON &&
						  phase !== PHASE.AFTER_TRADE_DEADLINE ? (
							<p className="text-warning">
								This only works during the regular season.
							</p>
						) : null}

						<button
							type="button"
							className="btn btn-god-mode border-0"
							disabled={
								(phase !== PHASE.REGULAR_SEASON &&
									phase !== PHASE.AFTER_TRADE_DEADLINE) ||
								!godMode
							}
							onClick={async () => {
								await toWorker("main", "allStarGameNow", undefined);

								logEvent({
									saveToDb: false,
									text: "The All-Star Game has been scheduled.",
									type: "info",
								});
							}}
						>
							Schedule All-Star Game now
						</button>
					</div>
				) : null}
			</div>

			<div className="col-md-6">
				<h2>Auto save</h2>

				<p>
					By default, your league is automatically saved as you play. Usually
					this is what you want. But sometimes you might want to experiment with
					re-playing parts of the game multiple times. When your league is saved
					automatically, you can't easily do that.
				</p>
				<p>
					To enable that kind of experimentation, here you can disable auto
					saving. This is not well tested and could break things, but it seems
					to generally work.
				</p>
				<p>
					If you play enough seasons with auto saving disabled, things will get
					slow because it has to keep everything in memory. But within a single
					season, disabling auto saving will actually make things faster.
				</p>

				<p>
					This setting is only temporary. If you restart your browser or switch
					to another league, auto save will be enabled again.
				</p>

				<AutoSave autoSave={autoSave} godMode={godMode} />

				<h2 className="mt-5">Worker console</h2>

				<p>
					If all the God Mode settings aren't enough for you, you can do more
					advanced customization by running some code that modifies your league.{" "}
					<a href={`https://${WEBSITE_ROOT}/manual/worker-console/`}>
						Click here for more information and some example code snippets.
					</a>
				</p>

				<p className="alert alert-danger">
					<b>Warning!</b> Please make sure the code you enter here comes from a
					trusted source. Malicious code could edit or delete any of your saved
					leagues.
				</p>

				<WorkerConsole godMode={godMode} />
			</div>
		</div>
	);
};

export default DangerZone;
