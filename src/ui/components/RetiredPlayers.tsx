import { useState } from "react";
import { isSport } from "../../common/sportFunctions.ts";
import { helpers } from "../util/helpers.ts";
import { toWorker } from "../util/toWorker.ts";
import { ActionButton } from "./ActionButton.tsx";
import { downloadFile } from "../util/downloadFile.ts";
import { getCol } from "../../common/getCol.ts";

export const RetiredPlayers = ({
	retiredPlayers,
	retiredStat,
	season,
	userTid,
}: {
	retiredPlayers: {
		age: number;
		hof: boolean;
		name: string;
		pid: number;
		pos: string;
		t?: {
			abbrev: string;
			tid: number;
		};
		stat: number;
	}[];
	retiredStat: string;
	season: number;
	userTid: number;
}) => {
	const [exporting, setExporting] = useState(false);

	const statCol = getCol(`stat:${retiredStat}`);

	return (
		<>
			<h2>Retired Players</h2>
			<p
				style={{
					columns: "240px",
				}}
			>
				{retiredPlayers.length === 0 ? "None" : null}
				{retiredPlayers.map((p) => (
					<span
						key={p.pid}
						className={p.t?.tid === userTid ? "table-info" : undefined}
					>
						{isSport("football") ? `${p.pos} ` : null}
						<a href={helpers.leagueUrl(["player", p.pid])}>{p.name}</a> (
						{p.t && p.t.tid >= 0 ? (
							<>
								<a
									href={helpers.leagueUrl([
										"roster",
										`${p.t.abbrev}_${p.t.tid}`,
										season,
									])}
								>
									{p.t.abbrev}
								</a>
								,{" "}
							</>
						) : null}
						{p.age} yo, {helpers.roundStat(p.stat, retiredStat, true)}{" "}
						{statCol.title}
						{p.hof ? (
							<>
								,{" "}
								<a href={helpers.leagueUrl(["hall_of_fame"])}>
									<b>HoF</b>
								</a>
							</>
						) : null}
						)<br />
					</span>
				))}
			</p>
			{retiredPlayers.length > 0 ? (
				<ActionButton
					variant="light-bordered"
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
			) : null}
		</>
	);
};
