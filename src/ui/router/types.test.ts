import { assert as typeAssert, type IsExact } from "conditional-type-checks";
import { test } from "vitest";
import type { LeagueUrlParts, RouteParams } from "./types.ts";

test("RouteParams", () => {
	typeAssert<IsExact<RouteParams<"dashboard">, Record<string, never>>>(true);

	typeAssert<IsExact<RouteParams<"newLeague">, { x?: string }>>(true);

	typeAssert<
		IsExact<
			RouteParams<"gameLog">,
			{
				gid?: string;
				lid: string;
				season?: string;
				team?: string;
				view?: string;
			}
		>
	>(true);
});

test("LeagueUrlParts", () => {
	type Accepts<T> = T extends LeagueUrlParts ? true : false;

	typeAssert<Accepts<[]>>(true);
	typeAssert<Accepts<["standings"]>>(true);
	typeAssert<Accepts<["standings", 2026]>>(true);

	// Trailing wildcard can be undefined when the route without it exists
	typeAssert<Accepts<["standings", undefined]>>(true);

	// Not a league route
	typeAssert<Accepts<["achievements"]>>(false);
	typeAssert<Accepts<["godMode"]>>(false);
});
