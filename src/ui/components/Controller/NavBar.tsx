import { PHASE } from "../../../common/constants.ts";
import { helpers } from "../../util/helpers.ts";
import { localActions, useLocal } from "../../util/local.ts";
import { useViewData } from "../../util/viewManager.tsx";
import DropdownLinks from "../DropdownLinks.tsx";
import { Icon } from "../Icon.tsx";
import LogoAndText from "../LogoAndText.tsx";
import PlayMenu from "../PlayMenu.tsx";
import { menuItems } from "../../util/menuItems.tsx";

const PhaseStatusBlock = () => {
	const { liveGameInProgress, phase, phaseText, statusText } = useLocal([
		"liveGameInProgress",
		"phase",
		"phaseText",
		"statusText",
	]);

	// Hide phase and status, to prevent revealing that the playoffs has ended, thus spoiling a 3-0/3-1/3-2 finals
	// game. This is needed because game sim happens before the results are displayed in liveGame.
	const text = (
		<>
			{liveGameInProgress ? "Live game" : phaseText}
			<br />
			{liveGameInProgress ? "in progress" : statusText}
		</>
	);

	const urls = {
		[PHASE.EXPANSION_DRAFT]: ["draft"],
		[PHASE.FANTASY_DRAFT]: ["draft"],
		[PHASE.PRESEASON]: ["roster"],
		[PHASE.REGULAR_SEASON]: ["roster"],
		[PHASE.AFTER_TRADE_DEADLINE]: ["roster"],
		[PHASE.PLAYOFFS]: ["playoffs"],
		// Hack because we don't know repeatSeason and draftType, see updatePhase
		[PHASE.DRAFT_LOTTERY]: phaseText.includes("after playoffs")
			? ["draft_scouting"]
			: ["draft_lottery"],
		[PHASE.DRAFT]: ["draft"],
		[PHASE.AFTER_DRAFT]: ["draft_history"],
		[PHASE.RESIGN_PLAYERS]: ["negotiation"],
		[PHASE.FREE_AGENCY]: ["free_agents"],
	};
	const urlParts = urls[phase];

	return (
		<div className="dropdown-links navbar-nav flex-shrink-1 overflow-hidden text-nowrap">
			<div className="nav-item">
				<a
					href={helpers.leagueUrl(urlParts)}
					className="nav-link"
					style={{
						lineHeight: 1.35,
						padding: "9px 0 8px 16px",
					}}
				>
					{text}
				</a>
			</div>
		</div>
	);
};

export const NavBar = ({ updating }: { updating: boolean }) => {
	const {
		lid,
		godMode,
		gold,
		sidebarOpen,
		spectator,
		playMenuOptions,
		popup,
		username,
	} = useLocal([
		"lid",
		"godMode",
		"gold",
		"sidebarOpen",
		"spectator",
		"playMenuOptions",
		"popup",
		"username",
	]);
	const viewInfo = useViewData();

	// Checking lid too helps with some flicker
	const inLeague = viewInfo?.inLeague && lid !== undefined;

	if (popup) {
		return <div />;
	}

	const userBlock = username ? (
		<a className="nav-link" href="/account" aria-label="Account">
			<Icon name="user" />{" "}
			<span className="d-none d-lg-inline">{username}</span>
		</a>
	) : (
		<a
			className="nav-link"
			href="/account/login_or_register"
			aria-label="Login/Register"
		>
			<Icon name="user" />{" "}
			<span className="d-none d-lg-inline">Login/Register</span>
		</a>
	);

	return (
		<nav className="navbar navbar-expand-sm navbar-border fixed-top flex-nowrap">
			<div className="container-fluid">
				<button
					className="navbar-toggler me-2 d-block"
					onClick={() => {
						localActions.setSidebarOpen(!sidebarOpen);
					}}
					type="button"
					aria-label="Toggle navigation"
				>
					<span className="navbar-toggler-icon" />
				</button>
				<LogoAndText gold={gold} inLeague={inLeague} updating={updating} />
				{inLeague ? (
					<ul className="navbar-nav">
						<PlayMenu
							lid={lid}
							spectator={spectator}
							options={playMenuOptions}
						/>
					</ul>
				) : null}
				{inLeague ? <PhaseStatusBlock /> : null}
				<div className="flex-grow-1" />
				<div className="d-none d-sm-flex">
					<DropdownLinks
						godMode={godMode}
						inLeague={inLeague}
						lid={lid}
						menuItems={menuItems.filter(
							(menuItem) => !menuItem.commandPaletteOnly,
						)}
					/>
				</div>
				<ul className="navbar-nav" id="top-user-block">
					<li className="nav-item">{userBlock}</li>
				</ul>
			</div>
		</nav>
	);
};
