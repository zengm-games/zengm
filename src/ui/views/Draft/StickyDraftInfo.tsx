import clsx from "clsx";
import { helpers, useLocal } from "../../util/index.ts";
import { TeamLogoInline } from "../../components/index.tsx";
import type { LocalStateUI } from "../../../common/types.ts";
import PlayerNameLabels from "../../components/PlayerNameLabels.tsx";

const Logo = ({
	t,
	tid,
}: {
	t: LocalStateUI["teamInfoCache"][number];
	tid: number;
}) => {
	return (
		<a href={helpers.leagueUrl(["roster", `${t.abbrev}_${tid}`])}>
			<TeamLogoInline imgURL={t.imgURL} imgURLSmall={t.imgURLSmall} size={32} />
		</a>
	);
};

const PickTeam = ({
	draft,
	lineBreak,
	t,
	tid,
}: {
	draft: {
		round: number;
		pick: number;
	};
	lineBreak?: boolean;
	t: LocalStateUI["teamInfoCache"][number];
	tid: number;
}) => {
	return (
		<>
			{draft.round}-{draft.pick}
			{lineBreak ? <br /> : " "}
			<a href={helpers.leagueUrl(["roster", `${t.abbrev}_${tid}`])}>
				<span className="d-md-none">{t.abbrev}</span>
				<span className="d-none d-md-inline">
					{t.region} {t.name}
				</span>
			</a>
		</>
	);
};

const PickWithoutPlayers = ({
	draft,
	t,
}: {
	draft: {
		round: number;
		pick: number;
		tid: number;
	};
	t: LocalStateUI["teamInfoCache"][number];
}) => {
	return (
		<div className="d-flex align-items-center gap-2">
			<Logo t={t} tid={draft.tid} />
			<div>
				<PickTeam draft={draft} lineBreak t={t} tid={draft.tid} />
			</div>
		</div>
	);
};

const YoureUp = ({ numPicks }: { numPicks: number }) => {
	const color =
		numPicks === 0
			? "bg-success"
			: numPicks === 1
				? "bg-warning"
				: "bg-secondary";

	return (
		<div
			className={clsx(
				"py-2 ps-3 pe-2 text-end rounded-start-pill text-nowrap align-self-stretch d-flex align-items-center",
				color,
			)}
		>
			<div>
				You're up:
				<br />
				{numPicks < 0 ? (
					"next year!"
				) : numPicks === 0 ? (
					<b>now!</b>
				) : numPicks === 1 ? (
					<b>next!</b>
				) : (
					<>
						in <b>{numPicks}</b> picks
					</>
				)}
			</div>
		</div>
	);
};

export const StickyDraftInfo = ({
	challengeNoRatings,
	drafted,
	userTids,
}: {
	challengeNoRatings: boolean;
	drafted: any[];
	userTids: number[];
}) => {
	const teamInfoCache = useLocal((state) => state.teamInfoCache);

	const currentPickIndex = drafted.findIndex((p) => p.pid === -1);
	if (currentPickIndex === -1) {
		return;
	}

	const currentPick = drafted[currentPickIndex].draft;
	const prevPick = drafted[currentPickIndex - 1];
	const nextPick = drafted[currentPickIndex + 1]?.draft;

	const yourNextPickIndex = drafted.findIndex(
		(p, i) => i >= currentPickIndex && userTids.includes(p.draft.tid),
	);
	const yourNextPick = yourNextPickIndex - currentPickIndex;

	return (
		<div
			className="d-flex align-items-center gap-2 mb-3 bg-secondary-subtle sticky-top"
			style={{
				marginLeft: "-0.5rem",
				paddingLeft: "0.5rem",
				marginRight: "-0.5rem",
				top: "52px",
			}}
		>
			<div className="d-flex flex-grow-1 bg-secondary-subtle py-1">
				<div className="flex-fill">
					<h4 className="mb-1">Previous pick</h4>
					<div>
						{prevPick ? (
							<>
								<div className="d-flex align-items-center gap-2">
									<Logo
										t={teamInfoCache[prevPick.draft.tid]!}
										tid={prevPick.draft.tid}
									/>
									<div>
										<PickTeam
											draft={prevPick.draft}
											t={teamInfoCache[prevPick.draft.tid]!}
											tid={prevPick.draft.tid}
										/>

										<div>
											<span className="d-none d-md-inline">
												{prevPick.ratings.pos}{" "}
											</span>
											<PlayerNameLabels
												pid={prevPick.pid}
												injury={prevPick.injury}
												skills={prevPick.ratings.skills}
												watch={prevPick.watch}
												firstName={prevPick.firstName}
												firstNameShort={prevPick.firstNameShort}
												lastName={prevPick.lastName}
											/>
											<span className="d-none d-md-inline ps-1">
												{" "}
												{!challengeNoRatings
													? `${prevPick.ratings.ovr}/${prevPick.ratings.pot}, `
													: null}
												{prevPick.age} yo
											</span>
										</div>
									</div>
								</div>
							</>
						) : (
							"None"
						)}
					</div>
				</div>
				<div className="flex-fill">
					<h4 className="mb-1">Current pick</h4>
					<PickWithoutPlayers
						draft={currentPick}
						t={teamInfoCache[currentPick.tid]!}
					/>
				</div>
				<div className="d-none d-sm-block flex-fill">
					<h4 className="mb-1">Next pick</h4>
					<div>
						{nextPick ? (
							<PickWithoutPlayers
								draft={nextPick}
								t={teamInfoCache[nextPick.tid]!}
							/>
						) : (
							"None"
						)}
					</div>
				</div>
			</div>
			<YoureUp numPicks={yourNextPick} />
		</div>
	);
};
