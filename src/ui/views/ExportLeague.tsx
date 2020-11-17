import React, { useCallback, useState, ReactNode, FormEvent } from "react";
import { MoreLinks } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { downloadFile, helpers, toWorker } from "../util";

const categories = [
	{
		objectStores: "players,releasedPlayers,awards",
		name: "Players",
		desc: "All player info, ratings, stats, and awards",
		checked: true,
	},
	{
		objectStores: "teams,teamSeasons,teamStats",
		name: "Teams",
		desc: "All team info and stats.",
		checked: true,
	},
	{
		objectStores: "schedule,playoffSeries",
		name: "Schedule",
		desc: "Current regular season schedule and playoff series.",
		checked: true,
	},
	{
		objectStores: "draftPicks",
		name: "Draft Picks",
		desc: "Traded draft picks.",
		checked: true,
	},
	{
		objectStores:
			"trade,negotiations,gameAttributes,draftLotteryResults,messages,events,playerFeats,allStars,scheduledEvents",
		name: "Game State",
		desc:
			"Interactions with the owner, current contract negotiations, current game phase, etc. Useful for saving or backing up a game, but not for creating custom rosters to share.",
		checked: true,
	},
	{
		objectStores: "games",
		name: "Box Scores",
		desc:
			"Box scores take up tons of space, but by default only three seasons are saved.",
		checked: false,
	},
];

const ExportLeague = () => {
	const [status, setStatus] = useState<ReactNode | undefined>();
	const [compressed, setCompressed] = useState(true);

	const handleSubmit = useCallback(
		async (event: FormEvent) => {
			event.preventDefault();

			setStatus("Exporting...");

			// @ts-ignore
			const elements = (event.target.getElementsByTagName(
				"input",
			) as never) as HTMLInputElement[];

			// Get array of object stores to export
			const objectStores = Array.from(elements)
				.filter(input => input.checked && input.name !== "compressed")
				.map(input => input.value)
				.join(",")
				.split(",");

			try {
				const { filename, json } = await toWorker(
					"main",
					"exportLeague",
					objectStores,
					compressed,
				);

				downloadFile(filename, json, "application/json");
			} catch (err) {
				console.error(err);
				setStatus(
					<span className="text-danger">
						Error exporting league: "{err.message}
						". You might have to select less things to export or{" "}
						<a href={helpers.leagueUrl(["delete_old_data"])}>
							delete old data
						</a>{" "}
						before exporting.
					</span>,
				);
				return;
			}

			setStatus(undefined);
		},
		[compressed],
	);

	useTitleBar({ title: "Export League" });

	return (
		<>
			<MoreLinks type="importExport" page="export_league" />
			<p>
				Here you can export your entire league data to a single League File. A
				League File can serve many purposes. You can use it as a <b>backup</b>,
				to <b>copy a league from one computer to another</b>, or to use as the
				base for a <b>custom roster file</b> to share with others. Select as
				much or as little information as you want to export, since any missing
				information will be filled in with default values when it is used.{" "}
				<a href={`http://${process.env.SPORT}-gm.com/manual/customization/`}>
					Read the manual for more info.
				</a>
			</p>

			<form onSubmit={handleSubmit}>
				<div className="row">
					<div className="col-md-6 col-lg-5 col-xl-4">
						<h2>Data</h2>
						{categories.map(cat => (
							<div key={cat.name} className="form-check">
								<label className="form-check-label">
									<input
										className="form-check-input"
										type="checkbox"
										value={cat.objectStores}
										defaultChecked={cat.checked}
									/>
									{cat.name}
									<p className="text-muted">{cat.desc}</p>
								</label>
							</div>
						))}
					</div>
					<div className="col-md-6 col-lg-5 col-xl-4">
						<h2>Format</h2>
						<div className="form-check mb-3">
							<label className="form-check-label">
								<input
									className="form-check-input"
									type="checkbox"
									name="compressed"
									checked={compressed}
									onChange={() => {
										setCompressed(compressed => !compressed);
									}}
								/>
								Compressed (no extra whitespace)
							</label>
						</div>
					</div>
				</div>
				<div className="row">
					<div className="col-lg-10 col-xl-8 text-center">
						<button
							type="submit"
							className="btn btn-primary"
							disabled={status === "Exporting..."}
						>
							{status === "Exporting..." ? "Exporting..." : "Export League"}
						</button>
					</div>
				</div>
			</form>

			{status && status !== "Exporting..." ? (
				<p className="mt-3 text-center">{status}</p>
			) : null}
		</>
	);
};

export default ExportLeague;
