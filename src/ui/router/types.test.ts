import { assert as typeAssert, type IsExact } from "conditional-type-checks";
import { test } from "vitest";
import type { RouteParams } from "./types.ts";

test("RouteParams", () => {
	typeAssert<IsExact<RouteParams<"dashboard">, Record<string, never>>>(true);

	typeAssert<IsExact<RouteParams<"newLeague">, { x?: string }>>(true);

	typeAssert<
		IsExact<
			RouteParams<"gameLog">,
			{
				abbrev?: string;
				gid?: string;
				lid: string;
				season?: string;
				view?: string;
			}
		>
	>(true);
});
