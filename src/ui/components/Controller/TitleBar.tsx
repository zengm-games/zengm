import Dropdown from "../Dropdown.tsx";
import DropdownLinks from "../DropdownLinks.tsx";
import { helpers } from "../../util/index.ts";
import { useLocalPartial } from "../../util/local.ts";
import type { MenuItemHeader } from "../../../common/types.ts";
import { useCallback } from "react";

type Props = {
	parts?: (number | string)[];
};

const NewWindowLink = ({ parts }: Props) => {
	const handleClick = useCallback(() => {
		const url = parts ? helpers.leagueUrl(parts) : document.URL;

		// Window name is set to the current time, so each window has a unique name and thus a new window is always opened
		window.open(
			`${url}?w=popup`,
			String(Date.now()),
			"height=600,width=800,scrollbars=yes",
		);
	}, [parts]);
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="13"
			height="13"
			viewBox="0 0 272.8 272.9"
			className="new_window ms-2"
			onClick={handleClick}
		>
			<title>Open in new window</title>
			<path fill="none" strokeWidth="20" d="M60 10h203v203H60z" />
			<path
				d="M107 171L216 55v75-75h-75"
				fill="none"
				strokeWidth="30"
				strokeLinejoin="bevel"
			/>
			<path d="M205 40h26v15h-26z" />
			<path d="M10 50v223" strokeWidth="20" />
			<path d="M10 263h213M1 60h60M213 220v46" strokeWidth="20" />
		</svg>
	);
};

const genPath = (parts: string[], season: string | undefined) => {
	if (season !== undefined) {
		return [...parts, season];
	}

	return parts;
};

export const TitleBar = () => {
	const {
		title,
		customMenu,
		hideNewWindow,
		jumpTo,
		jumpToSeason,
		dropdownCustomOptions,
		dropdownCustomURL,
		dropdownView,
		dropdownFields,
		moreInfoAbbrev,
		moreInfoSeason,
		moreInfoTid,
		lid,
	} = useLocalPartial([
		"title",
		"customMenu",
		"hideNewWindow",
		"jumpTo",
		"jumpToSeason",
		"dropdownCustomOptions",
		"dropdownCustomURL",
		"dropdownView",
		"dropdownFields",
		"moreInfoAbbrev",
		"moreInfoSeason",
		"moreInfoTid",
		"lid",
	]);

	if (title === undefined) {
		return null;
	}

	const menuItems: MenuItemHeader[] = [];

	if (jumpTo) {
		// Sometimes the season will be some nonsense like "all", in which case we can't generally use
		// it (although maybe it would be good to in some cases).
		const season =
			typeof jumpToSeason === "number" ? String(jumpToSeason) : undefined;
		menuItems.push({
			type: "header",
			long: "Jump To",
			short: "Jump To",
			league: true,
			children: [
				{
					type: "link",
					league: true,
					path: genPath(["standings"], season),
					text: "Standings",
				},
				{
					type: "link",
					league: true,
					path: genPath(["playoffs"], season),
					text: "Playoffs",
				},
				{
					type: "link",
					league: true,
					path: genPath(["history"], season),
					text: "Season Summary",
				},
				{
					type: "link",
					league: true,
					path: genPath(["league_finances"], season),
					text: "Finances",
				},
				{
					type: "link",
					league: true,
					path: genPath(["news", "all"], season),
					text: "News Feed",
				},
				{
					type: "link",
					league: true,
					path: genPath(["draft_history"], season),
					text: "Draft",
				},
				{
					type: "link",
					league: true,
					path: genPath(["leaders"], season),
					text: "Leaders",
				},
				{
					type: "link",
					league: true,
					path: genPath(["team_stats"], season),
					text: "Team Stats",
				},
				{
					type: "link",
					league: true,
					path: genPath(["player_ratings", "all"], season),
					text: "Player Ratings",
				},
				{
					type: "link",
					league: true,
					path: genPath(["player_stats", "all"], season),
					text: "Player Stats",
				},
				{
					type: "link",
					league: true,
					path: genPath(["player_bios", "all"], season),
					text: "Player Bios",
				},
			],
		});
	}

	if (
		moreInfoAbbrev &&
		moreInfoSeason !== undefined &&
		moreInfoTid !== undefined
	) {
		menuItems.push({
			type: "header",
			long: "More Info",
			short: "More",
			league: true,
			children: [
				{
					type: "link",
					league: true,
					path: [
						"player_ratings",
						`${moreInfoAbbrev}_${moreInfoTid}`,
						moreInfoSeason,
					],
					text: "Player Ratings",
				},
				{
					type: "link",
					league: true,
					path: [
						"player_stats",
						`${moreInfoAbbrev}_${moreInfoTid}`,
						moreInfoSeason,
					],
					text: "Player Stats",
				},
				{
					type: "link",
					league: true,
					path: [
						"player_bios",
						`${moreInfoAbbrev}_${moreInfoTid}`,
						moreInfoSeason,
					],
					text: "Player Bios",
				},
			],
		});
	}

	if (customMenu) {
		menuItems.push(customMenu);
	}

	return (
		<aside className="navbar navbar-border navbar-light justify-content-start title-bar flex-shrink-0  py-0">
			<h1>
				{title}
				{!hideNewWindow ? <NewWindowLink /> : null}
			</h1>
			{dropdownView && dropdownFields ? (
				<Dropdown
					customURL={dropdownCustomURL}
					customOptions={dropdownCustomOptions}
					view={dropdownView}
					fields={dropdownFields}
				/>
			) : null}
			<DropdownLinks
				className="ms-auto title-bar-right-links"
				hideTitle
				inLeague
				lid={lid}
				menuItems={menuItems}
			/>
		</aside>
	);
};
