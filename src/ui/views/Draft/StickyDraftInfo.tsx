import clsx from "clsx";
import { helpers, useLocal } from "../../util/index.ts";
import { TeamLogoInline } from "../../components/index.tsx";
import type { LocalStateUI } from "../../../common/types.ts";
import PlayerNameLabels from "../../components/PlayerNameLabels.tsx";
import { DraftButtons } from "./DraftButtons.tsx";

const Logo = ({
	t,
	tid,
}: {
	t: LocalStateUI["teamInfoCache"][number];
	tid: number;
}) => {
	// TODO: Error here about t being undefined happens when switching from in league to not in league (like going to Global Settings)
	if (!t) {
		return;
	}

	return (
		<a href={helpers.leagueUrl(["roster", `${t.abbrev}_${tid}`])}>
			<TeamLogoInline
				imgURL={t.imgURL}
				imgURLSmall={t.imgURLSmall}
				includePlaceholderIfNoLogo
				size={32}
			/>
		</a>
	);
};

const PickTeam = ({
	draft,
	lineBreak,
	prefix,
	t,
	tid,
}: {
	draft: {
		round: number;
		pick: number;
	};
	lineBreak?: boolean;
	prefix?: string;
	t: LocalStateUI["teamInfoCache"][number];
	tid: number;
}) => {
	// TODO: Error here about t being undefined happens when switching from in league to not in league (like going to Global Settings)
	if (!t) {
		return;
	}

	return (
		<>
			<span className="d-none d-sm-inline">{prefix}</span>
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
	prefix,
	t,
}: {
	draft: {
		round: number;
		pick: number;
		tid: number;
	};
	prefix?: string;
	t: LocalStateUI["teamInfoCache"][number];
}) => {
	return (
		<div className="d-flex align-items-center gap-2">
			<Logo t={t} tid={draft.tid} />
			<div>
				<PickTeam
					draft={draft}
					lineBreak
					t={t}
					prefix={prefix}
					tid={draft.tid}
				/>
			</div>
		</div>
	);
};

const NextDraftText = ({
	season,
	userNextPickYear,
}: {
	season: number;
	userNextPickYear: number;
}) => {
	if (userNextPickYear <= season) {
		return "next draft";
	} else if (userNextPickYear === season + 1) {
		return "next year";
	} else {
		return `in ${userNextPickYear}!`;
	}
};

const YoureUp = ({
	numPicks,
	season,
	userNextPickYear,
}: {
	numPicks: number;
	season: number;
	userNextPickYear: number;
}) => {
	const color =
		numPicks === 0
			? "bg-success"
			: numPicks === 1
				? "bg-warning"
				: "bg-secondary";

	return (
		<div
			className={clsx(
				"ps-3 pe-2 text-end rounded-start-pill align-self-stretch d-flex align-items-center",
				color,
			)}
		>
			<div>
				You're up:
				<br />
				{numPicks < 0 ? (
					<NextDraftText season={season} userNextPickYear={userNextPickYear} />
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
	season,
	spectator,
	userNextPickYear,
	userTids,
}: {
	challengeNoRatings: boolean;
	drafted: any[];
	season: number;
	spectator: boolean;
	userNextPickYear: number;
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

	const userRemaining = yourNextPickIndex !== -1;
	const usersTurn = yourNextPick === 0;

	// Treat as equal size, unless we need to shrink
	const flex = "1 1 0";

	return (
		<div
			className="sticky-top mb-3 text-nowrap"
			style={{
				marginLeft: "-0.5rem",
				marginRight: "-0.5rem",
				top: "52px",
				pointerEvents: "none",
			}}
		>
			<div
				className="d-flex align-items-center bg-secondary-very-subtle"
				style={{
					paddingLeft: "0.5rem",
					pointerEvents: "auto",
				}}
			>
				<div className="d-none d-xxl-block me-3">
					<DraftButtons
						spectator={spectator}
						userRemaining={userRemaining}
						usersTurn={usersTurn}
					/>
				</div>
				<div className="d-flex flex-grow-1 gap-1 py-1">
					<div style={{ flex }}>
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
													defaultWatch={prevPick.watch}
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
							) : null}
						</div>
					</div>
					<div style={{ flex }}>
						<PickWithoutPlayers
							draft={currentPick}
							prefix="Current pick: "
							t={teamInfoCache[currentPick.tid]!}
						/>
					</div>
					<div className="d-none d-sm-block" style={{ flex }}>
						{nextPick ? (
							<PickWithoutPlayers
								draft={nextPick}
								prefix="Next pick: "
								t={teamInfoCache[nextPick.tid]!}
							/>
						) : (
							<div
								style={{
									// Account for no Logo
									paddingLeft: 40,
								}}
							>
								Next pick: none
							</div>
						)}
					</div>
				</div>
				<YoureUp
					numPicks={yourNextPick}
					season={season}
					userNextPickYear={userNextPickYear}
				/>
			</div>
			<div
				className="d-flex d-xxl-none"
				style={{
					paddingLeft: "0.5rem",
					pointerEvents: "none",
				}}
			>
				<div
					className="bg-secondary-very-subtle rounded-bottom pt-1"
					style={{
						pointerEvents: "auto",
					}}
				>
					<DraftButtons
						spectator={spectator}
						userRemaining={userRemaining}
						usersTurn={usersTurn}
					/>
				</div>
			</div>
		</div>
	);
};
