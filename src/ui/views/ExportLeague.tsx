import { useState, ReactNode, FormEvent, Fragment } from "react";
import { WEBSITE_ROOT } from "../../common";
import { MoreLinks } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { downloadFile, helpers, toWorker } from "../util";

export type ExportLeagueKey =
	| "players"
	| "teams"
	| "headToHead"
	| "schedule"
	| "draftPicks"
	| "gameStats"
	| "newsFeedTransactions"
	| "newsFeedOther"
	| "games";

const categories: {
	key: ExportLeagueKey;
	name: string;
	desc: string;
	default: boolean;
}[] = [
	{
		key: "players",
		name: "Players",
		desc: "All player info, ratings, stats, and awards",
		default: true,
	},
	{
		key: "teams",
		name: "Teams",
		desc: "All team info and stats.",
		default: true,
	},
	{
		key: "schedule",
		name: "Schedule",
		desc: "Current regular season schedule and playoff series.",
		default: true,
	},
	{
		key: "draftPicks",
		name: "Draft Picks",
		desc: "Traded draft picks.",
		default: true,
	},
	{
		key: "gameStats",
		name: "Game State",
		desc: "Interactions with the owner, current contract negotiations, current game phase, etc. Useful for saving or backing up a game, but not for creating custom rosters to share.",
		default: true,
	},
	{
		key: "newsFeedTransactions",
		name: "News Feed - Transactions",
		desc: "Trades, draft picks, and signings.",
		default: true,
	},
	{
		key: "newsFeedOther",
		name: "News Feed - All Other Entries",
		desc: "Trades, draft picks, and signings.",
		default: false,
	},
	{
		key: "headToHead",
		name: "Head-to-Head Data",
		desc: "History of head-to-head results between teams.",
		default: false,
	},
	{
		key: "games",
		name: "Box Scores",
		desc: "Box scores take up tons of space, but by default only three seasons are saved.",
		default: false,
	},
];

const ExportLeague = () => {
	const [status, setStatus] = useState<ReactNode | undefined>();
	const [compressed, setCompressed] = useState(true);
	const [checked, setChecked] = useState<Record<ExportLeagueKey, boolean>>(
		() => {
			const init = {
				players: false,
				teams: false,
				headToHead: false,
				schedule: false,
				draftPicks: false,
				gameStats: false,
				newsFeedTransactions: false,
				newsFeedOther: false,
				games: false,
			};

			for (const category of categories) {
				init[category.key] = category.default;
			}

			return init;
		},
	);

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();

		setStatus("Exporting...");

		try {
			const { filename, json } = await toWorker("main", "exportLeague", {
				...checked,
				compressed,
			});

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
	};

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
				<a href={`http://${WEBSITE_ROOT}/manual/customization/`}>
					Read the manual for more info.
				</a>
			</p>

			<form onSubmit={handleSubmit}>
				<div className="row">
					<div className="col-md-6 col-lg-5 col-xl-4">
						<h2>Data</h2>
						{categories.map(cat => (
							<Fragment key={cat.name}>
								<div className="form-check">
									<label className="form-check-label">
										<input
											className="form-check-input"
											type="checkbox"
											checked={checked[cat.key]}
											onChange={() => {
												setChecked(checked2 => ({
													...checked2,
													[cat.key]: !checked2[cat.key],
												}));
											}}
										/>
										{cat.name}
										<p className="text-muted">{cat.desc}</p>
									</label>
								</div>
							</Fragment>
						))}
					</div>
					<div className="col-md-6 col-lg-5 col-xl-4">
						<h2>Format</h2>
						<div className="form-check mb-3">
							<label className="form-check-label">
								<input
									className="form-check-input"
									type="checkbox"
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
							{status === "Exporting..." ? (
								<>
									<span
										className="spinner-border spinner-border-sm"
										role="status"
										aria-hidden="true"
									></span>{" "}
									Processing
								</>
							) : (
								"Export League"
							)}
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
