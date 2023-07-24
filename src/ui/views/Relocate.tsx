import { useState } from "react";
import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";
import { helpers, toWorker } from "../util";
import { TeamLogoJerseyInfo } from "../components/TeamLogoJerseyInfo";
import classNames from "classnames";

const Relocate = ({
	currentTeam,
	godMode,
	newTeam,
	realignInfo,
}: View<"relocate">) => {
	useTitleBar({ title: "Team Relocation Vote" });

	const [rebrandTeam, setRebrandTeam] = useState(true);
	const brandedTeam = rebrandTeam ? newTeam : currentTeam;

	const [realign, setRealign] = useState(true);
	const [override, setOverride] = useState(false);

	const [status, setStatus] = useState<
		| {
				type: "init";
		  }
		| {
				type: "voted";
		  }
		| {
				type: "results";
				for: number;
				against: number;
		  }
	>({ type: "init" });

	const vote = async (userVote: boolean) => {
		if (status.type !== "init") {
			return;
		}
		setStatus({
			type: "voted",
		});

		const results = await toWorker("main", "relocateVote", {
			override: false,
			realign: realign ? realignInfo?.realigned : undefined,
			rebrandTeam,
			userVote,
		});

		setStatus({
			type: "results",
			...results,
		});
	};

	return (
		<>
			<div className="mb-5">
				The{" "}
				<a
					href={helpers.leagueUrl([
						"roster",
						`${currentTeam.abbrev}_${currentTeam.tid}`,
					])}
				>
					{currentTeam.region} {currentTeam.name}
				</a>{" "}
				want to move to <b>{newTeam.region}</b>.
			</div>

			<div className="d-flex flex-wrap gap-5 mb-5">
				<div>
					<TeamLogoJerseyInfo
						brandedTeam={brandedTeam}
						selectedTeam={newTeam}
					/>
					<div className="form-check mt-2">
						<input
							type="checkbox"
							className="form-check-input"
							id="relocate-reband"
							checked={rebrandTeam}
							disabled={status.type !== "init"}
							onChange={() => {
								setRebrandTeam(checked => !checked);
							}}
						/>
						<label className="form-check-label" htmlFor="relocate-reband">
							Rebrand team
						</label>
					</div>
				</div>

				{realignInfo ? (
					<div>
						<h3>Divisions after relocation</h3>

						{(realign ? realignInfo.realigned : realignInfo.current).map(
							(conf, i) => {
								return (
									<div
										key={i}
										className={classNames("d-flex gap-3", {
											"mt-2": i > 0,
										})}
									>
										{conf.map((div, j) => {
											return (
												<ul
													key={j}
													className="list-unstyled mb-0"
													style={{ width: 170 }}
												>
													{div.map(t => {
														let teamName = `${t.region} ${t.name}`;
														if (t.tid === newTeam.tid) {
															if (!rebrandTeam) {
																teamName = `${t.region} ${currentTeam.name}`;
															}
														}

														return (
															<li
																key={t.tid}
																className={classNames(
																	"text-nowrap overflow-hidden",
																	{
																		"text-success": t.tid === newTeam.tid,
																		"text-info":
																			realign &&
																			t.tid !== newTeam.tid &&
																			!realignInfo.current[i][j].some(
																				t2 => t2.tid === t.tid,
																			),
																	},
																)}
																style={{ textOverflow: "ellipsis" }}
															>
																{teamName}
															</li>
														);
													})}
												</ul>
											);
										})}
									</div>
								);
							},
						)}
						<div className="form-check mt-2">
							<input
								type="checkbox"
								className="form-check-input"
								id="relocate-realign"
								checked={realign}
								disabled={status.type !== "init"}
								onChange={() => {
									setRealign(checked => !checked);
								}}
							/>
							<label className="form-check-label" htmlFor="relocate-realign">
								Realign divisions
							</label>
						</div>
					</div>
				) : null}
			</div>

			<p>This move must be approved by a majority of teams. How do you vote?</p>

			<div className="text-center d-inline-block">
				<div className="d-flex gap-3">
					<button
						className="btn btn-lg btn-success"
						disabled={status.type !== "init"}
						onClick={() => {
							vote(true);
						}}
					>
						Move to {newTeam.region}
					</button>
					<button
						className="btn btn-lg btn-danger"
						disabled={status.type !== "init"}
						onClick={() => {
							vote(false);
						}}
					>
						Stay in {currentTeam.region}
					</button>
				</div>
				{godMode ? (
					<div className="mt-3">
						<label className="god-mode god-mode-text mb-0">
							<input
								className="form-check-input me-1"
								type="checkbox"
								onChange={() => {
									setOverride(checked => !checked);
								}}
								checked={override}
								disabled={status.type !== "init"}
							/>
							Force result
						</label>
					</div>
				) : null}
			</div>
		</>
	);
};

export default Relocate;
