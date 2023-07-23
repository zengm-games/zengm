import { useState } from "react";
import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";
import { helpers } from "../util";
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

	console.log({
		currentTeam,
		godMode,
		newTeam,
		realignInfo,
	});

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
				woud like to move to <b>{newTeam.region}</b>.
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

						{realignInfo.current.map((conf, i) => {
							return (
								<div
									key={i}
									className={classNames("d-flex gap-3", {
										"mt-3": i > 0,
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
						})}
						<div className="form-check mt-2">
							<input
								type="checkbox"
								className="form-check-input"
								id="relocate-realign"
								checked={realign}
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
		</>
	);
};

export default Relocate;
