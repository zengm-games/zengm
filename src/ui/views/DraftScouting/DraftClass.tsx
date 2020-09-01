import PropTypes from "prop-types";
import React, { useState } from "react";
import {
	DataTable,
	LeagueFileUpload,
	PlayerNameLabels,
} from "../../components";
import { downloadFile, getCols, toWorker } from "../../util";
import type { View } from "../../../common/types";

const DraftClass = ({
	challengeNoRatings,
	godMode,
	offset,
	players,
	season,
}: {
	challengeNoRatings: boolean;
	godMode: boolean;
	offset: number;
	players: View<"draftScouting">["seasons"][0]["players"];
	season: number;
}) => {
	const [showImportForm, setShowImportForm] = useState(false);
	const [status, setStatus] = useState<"exporting" | "loading" | undefined>();

	const cols = getCols("#", "Name", "Pos", "Age", "Ovr", "Pot");

	const rows = players.map(p => {
		return {
			key: p.pid,
			data: [
				p.rank,
				<PlayerNameLabels pid={p.pid} skills={p.skills} watch={p.watch}>
					{p.nameAbbrev}
				</PlayerNameLabels>,
				p.pos,
				p.age,
				!challengeNoRatings ? p.ovr : null,
				!challengeNoRatings ? p.pot : null,
			],
		};
	});

	return (
		<>
			<h2>{season}</h2>

			<div className="btn-group mb-3">
				<button
					className="btn btn-light-bordered btn-xs"
					onClick={() => setShowImportForm(val => !val)}
				>
					Import
				</button>
				<button
					className="btn btn-light-bordered btn-xs"
					disabled={status === "exporting" || status === "loading"}
					onClick={async () => {
						setStatus("exporting");

						const { filename, json } = await toWorker(
							"main",
							"exportDraftClass",
							season,
						);
						downloadFile(filename, json, "application/json");

						setStatus(undefined);
					}}
				>
					Export
				</button>
				{godMode ? (
					<button
						className="btn btn-god-mode btn-xs"
						disabled={status === "exporting" || status === "loading"}
						onClick={async () => {
							setStatus("loading");

							await toWorker("main", "regenerateDraftClass", season);

							setStatus(undefined);
						}}
					>
						Regenerate
					</button>
				) : null}
			</div>

			{showImportForm ? (
				<div>
					<p>
						To replace this draft class with players from a{" "}
						<a
							href="https://basketball-gm.com/manual/customization/draft-class/"
							rel="noopener noreferrer"
							target="_blank"
						>
							custom draft class file
						</a>
						, select the file below.
					</p>
					<LeagueFileUpload
						disabled={status === "exporting"}
						onLoading={() => {
							setStatus("loading");
						}}
						onDone={async (err, leagueFile) => {
							if (err) {
								return;
							}

							await toWorker(
								"main",
								"handleUploadedDraftClass",
								leagueFile,
								season,
							);

							setShowImportForm(false);
							setStatus(undefined);
						}}
					/>
					<p />
				</div>
			) : null}

			<DataTable
				cols={cols}
				defaultSort={[0, "asc"]}
				name={`DraftScouting:${offset}`}
				rows={rows}
			/>
		</>
	);
};

DraftClass.propTypes = {
	offset: PropTypes.number.isRequired,
	players: PropTypes.arrayOf(PropTypes.object).isRequired,
	season: PropTypes.number.isRequired,
};

export default DraftClass;
