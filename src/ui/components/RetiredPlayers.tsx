import { useState } from "react";
import { isSport } from "../../common";
import { downloadFile, helpers, toWorker } from "../util";
import ActionButton from "./ActionButton";

const RetiredPlayers = ({
	retiredPlayers,
	season,
	userTid,
}: {
	retiredPlayers: {
		age: number;
		hof: boolean;
		name: string;
		pid: number;
		ratings: {
			pos: string;
		};
		stats: {
			abbrev: string;
			tid: number;
		};
	}[];
	season: number;
	userTid: number;
}) => {
	const [exporting, setExporting] = useState(false);
	return (
		<>
			<h2>Retired Players</h2>
			<p
				style={{
					MozColumnWidth: "12em",
					MozColumns: "12em",
					WebkitColumns: "12em",
					columns: "12em",
				}}
			>
				{retiredPlayers.map(p => (
					<span
						key={p.pid}
						className={p.stats.tid === userTid ? "table-info" : undefined}
					>
						{isSport("football") ? `${p.ratings.pos} ` : null}
						<a href={helpers.leagueUrl(["player", p.pid])}>{p.name}</a> (
						{p.stats.tid >= 0 ? (
							<>
								<a
									href={helpers.leagueUrl([
										"roster",
										`${p.stats.abbrev}_${p.stats.tid}`,
										season,
									])}
								>
									{p.stats.abbrev}
								</a>
								,{" "}
							</>
						) : null}
						age: {p.age}
						{p.hof ? (
							<>
								;{" "}
								<a href={helpers.leagueUrl(["hall_of_fame"])}>
									<b>HoF</b>
								</a>
							</>
						) : null}
						)<br />
					</span>
				))}
			</p>
			<ActionButton
				variant="light-bordered"
				disabled={exporting}
				onClick={async () => {
					try {
						setExporting(true);

						const { filename, json } = await toWorker(
							"main",
							"exportDraftClass",
							{ season, retiredPlayers: true },
						);
						downloadFile(filename, json, "application/json");
					} finally {
						setExporting(false);
					}
				}}
				processing={exporting}
				processingText="Exporting"
			>
				Export as draft class
			</ActionButton>
		</>
	);
};

export default RetiredPlayers;
