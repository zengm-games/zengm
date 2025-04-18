import Dropdown from "./Dropdown.tsx";
import DropdownLinks from "./DropdownLinks.tsx";
import NewWindowLink from "./NewWindowLink.tsx";
import { useLocalPartial } from "../util/index.ts";
import type { MenuItemHeader } from "../../common/types.ts";

const genPath = (parts: string[], season: string | undefined) => {
	if (season !== undefined) {
		return [...parts, season];
	}

	return parts;
};

const TitleBar = () => {
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

export default TitleBar;
