import type { ReactNode } from "react";
import type { MenuItemLink } from "../../common/types.ts";
import { helpers } from "./helpers.ts";

export const getText = (
	text: MenuItemLink["text"],
): Exclude<ReactNode, null | undefined | number | boolean> => {
	if (typeof text === "object" && "side" in text) {
		return text.side;
	}

	return text;
};

export const makeAnchorProps = (
	menuItem: MenuItemLink,
	onMenuItemClick: () => void,
	closeBeforeOnClickResolves?: boolean,
): {
	onClick: () => void;
	href?: string;
	rel?: string;
	target?: string;
} => {
	let href;
	let rel;
	let target;

	if (typeof menuItem.path === "string") {
		href = menuItem.path;

		if (menuItem.path.startsWith("http")) {
			rel = "noopener";
			target = "_blank";
		}
	} else if (menuItem.path !== undefined) {
		href = helpers.leagueUrl(menuItem.path);
	}

	const onClick = async () => {
		if (menuItem.onClick) {
			if (closeBeforeOnClickResolves) {
				onMenuItemClick();
			}

			// Don't close menu if response is false
			const response = await menuItem.onClick();

			if (response !== false && !closeBeforeOnClickResolves) {
				onMenuItemClick();
			}
		} else {
			onMenuItemClick();
		}
	};

	return {
		onClick,
		href,
		rel,
		target,
	};
};
