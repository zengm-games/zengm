import orderBy from "lodash-es/orderBy";
import range from "lodash-es/range";
import { useEffect, useState } from "react";
import { isSport, PHASE } from "../../common";
import type { Player, RealTeamInfo, View } from "../../common/types";
import useTitleBar from "../hooks/useTitleBar";
import { toWorker } from "../util";
import { applyRealTeamInfos, MAX_SEASON, MIN_SEASON } from "./NewLeague";

const SelectTeam = ({
	realTeamInfo,
}: {
	realTeamInfo: RealTeamInfo | undefined;
}) => {
	const [season, setSeason] = useState(MAX_SEASON);
	const [loadingTeams, setLoadingTeams] = useState(true);
	const [tid, setTid] = useState(0);
	const [teams, setTeams] = useState<
		{
			abbrev: string;
			imgURL: string;
			region: string;
			name: string;
			tid: number;
			seasonInfo?: {
				won: number;
				lost: number;
				roundsWonText?: string;
			};
			players: Player[];
			ovr: number;
		}[]
	>([]);

	const loadTeams = async (season: number, firstLoad?: boolean) => {
		setLoadingTeams(true);

		const leagueInfo = await toWorker("main", "getLeagueInfo", {
			type: "real",
			season,
			phase: PHASE.PLAYOFFS,
			randomDebuts: false,
			realDraftRatings: "draft",
			realStats: "none",
			includeSeasonInfo: true,
		});
		const newTeams = orderBy(
			applyRealTeamInfos(leagueInfo.teams, realTeamInfo, season),
			["region", "name", "tid"],
		);

		const prevTeam = teams.find(t => t.tid === tid);
		let newTid;
		if (firstLoad) {
			const index = Math.floor(Math.random() * newTeams.length);
			newTid = newTeams[index].tid;
		} else {
			newTid =
				newTeams.find(t => t.abbrev === prevTeam?.abbrev)?.tid ??
				newTeams.find(t => t.region === prevTeam?.region)?.tid ??
				0;
		}

		setTeams(newTeams as any);
		setTid(newTid);
		setLoadingTeams(false);
	};

	useEffect(() => {
		loadTeams(MAX_SEASON, true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const t = teams.find(t => t.tid === tid);
	console.log(t);

	return (
		<>
			<form>
				<div className="input-group">
					<select
						className="form-select"
						value={season}
						onChange={async event => {
							const value = parseInt(event.target.value);
							setSeason(value);

							await loadTeams(value);
						}}
						style={{
							maxWidth: 75,
						}}
					>
						{range(MAX_SEASON, MIN_SEASON - 1).map(i => (
							<option key={i} value={i}>
								{i}
							</option>
						))}
					</select>
					<select
						className="form-select"
						value={tid}
						onChange={event => {
							const value = parseInt(event.target.value);
							setTid(value);
						}}
						disabled={loadingTeams}
					>
						{teams.map(t => (
							<option key={t.tid} value={t.tid}>
								{t.region} {t.name}
							</option>
						))}
					</select>
				</div>
			</form>

			<div className="d-flex">
				<div
					style={{ width: 128, height: 128 }}
					className="d-flex align-items-center justify-content-center my-2"
				>
					{t?.imgURL ? (
						<img className="mw-100 mh-100" src={t.imgURL} alt="Team logo" />
					) : null}
				</div>
				{t ? (
					<div className="d-flex align-items-center ms-2">
						<div>
							<h1 className="mb-0">{t.ovr} ovr</h1>
							{t.seasonInfo ? (
								<>
									<h1 className="mb-0">
										{t.seasonInfo.won}-{t.seasonInfo.lost}
									</h1>
									{t.seasonInfo.roundsWonText}
								</>
							) : null}
						</div>
					</div>
				) : null}
			</div>
			<ul className="list-unstyled mb-0">
				{t?.players.slice(0, 10).map(p => (
					<li key={p.pid}>
						{p.firstName} {p.lastName} - {p.ratings.at(-1).ovr} ovr
					</li>
				))}
			</ul>
		</>
	);
};

const Exhibition = ({ realTeamInfo }: View<"exhibition">) => {
	if (!isSport("basketball")) {
		throw new Error("Not supported");
	}

	useTitleBar({
		title: "Exhibition Game",
		hideNewWindow: true,
	});

	return (
		<div className="row" style={{ maxWidth: 600 }}>
			<div className="col-12 col-sm-6">
				<h2>Home</h2>
				<SelectTeam realTeamInfo={realTeamInfo} />
			</div>
			<div className="col-12 col-sm-6 mt-3 mt-sm-0">
				<h2>Away</h2>
				<SelectTeam realTeamInfo={realTeamInfo} />
			</div>
		</div>
	);
};

export default Exhibition;
