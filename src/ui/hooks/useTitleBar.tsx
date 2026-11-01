import { useEffect, useLayoutEffect } from "react";
import {
	dropdownOptionsStateKeys,
	findDropdownOption,
	getDropdownOptions,
} from "./useDropdownOptions.tsx";
import { localActions, useLocal } from "../util/local.ts";
import type { MenuItemHeader } from "../../common/types.ts";
import { GAME_NAME } from "../../common/constants.ts";
import {
	getResponsiveValue,
	type TitleBarDropdown,
	type TitleBarDropdownField,
} from "../components/Dropdown.tsx";
import type {
	LeagueUrlParts,
	MatchesRouteParams,
	ViewId,
} from "../router/types.ts";
import { getRouteUrl } from "../util/getRouteUrl.ts";
import { helpers } from "../util/helpers.ts";

type DropdownArg<
	V extends ViewId,
	Key extends string,
	ParamKey extends string,
> =
	| ({
			// The URL is the route of this view whose params are the field keys (and params keys)
			view: V;
			fields: TitleBarDropdownField<Key>[];

			// Route params that don't have a dropdown, like gid on the game log
			params?: Record<ParamKey, number | string>;
	  } & (MatchesRouteParams<V, Key | ParamKey> extends true
			? unknown
			: {
					error: `The keys of fields and params don't match the params of any route for ${V}`;
				}))
	| {
			// For when the URL isn't just the field values filled into one route, like a dropdown that switches between views
			fields: TitleBarDropdownField<Key>[];
			urlOverride: (values: Record<Key, number | string>) => LeagueUrlParts;
	  };

const useTitleBar = <
	V extends ViewId,
	const Key extends string,
	const ParamKey extends string = never,
>({
	title,
	titleLong,
	customMenu,
	hideNewWindow,
	jumpTo,
	jumpToSeason,
	dropdown,
	moreInfoSeason,
	moreInfoTid,
}: {
	title?: string;
	titleLong?: string;
	customMenu?: MenuItemHeader;
	hideNewWindow?: boolean;
	jumpTo?: boolean;
	jumpToSeason?: number | "all" | "career";
	dropdown?: DropdownArg<V, Key, ParamKey>;
	moreInfoSeason?: number;
	moreInfoTid?: number;
} = {}) => {
	const state = useLocal([...dropdownOptionsStateKeys]);

	useEffect(() => {
		const parts: string[] = [];

		if (titleLong) {
			parts.push(titleLong);
		} else if (title) {
			parts.push(title);
		} else {
			parts.push(GAME_NAME);
		}

		if (dropdown) {
			for (const field of dropdown.fields) {
				// Not much use showing "All X" in the title
				if (field.value === "all") {
					continue;
				}

				const option = findDropdownOption(
					getDropdownOptions(field.options, state),
					field.value,
				);
				if (option) {
					parts.push(getResponsiveValue(option.label, Infinity));
				}
			}
		}

		document.title = parts.join(" » ");
	}, [dropdown, state, title, titleLong]);

	// Without useLayoutEffect, weird shit happens in Safari! State inappropriately bleeds over from one load of a view to the next. Not sure why!
	useLayoutEffect(() => {
		let storedDropdown: TitleBarDropdown | undefined;
		if (dropdown) {
			storedDropdown = {
				fields: dropdown.fields,
				getUrl:
					"urlOverride" in dropdown
						? (values) =>
								// values only has the keys in fields, which is what Record<Key, ...> promises
								helpers.leagueUrl(
									dropdown.urlOverride(values as Record<Key, number | string>),
								)
						: (values) =>
								getRouteUrl(dropdown.view, { ...dropdown.params, ...values }),
			};
		}

		localActions.update({
			title,
			customMenu,
			hideNewWindow,
			jumpTo,
			jumpToSeason,
			dropdown: storedDropdown,
			moreInfoSeason,
			moreInfoTid,
		});
	}, [
		title,
		customMenu,
		hideNewWindow,
		jumpTo,
		jumpToSeason,
		dropdown,
		moreInfoSeason,
		moreInfoTid,
	]);
};

export default useTitleBar;
