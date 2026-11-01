import type { routeInfos } from "../util/routeInfos.ts";

type SegmentParams<S extends string> = S extends `:${infer Name}`
	? { [K in Name]: string }
	: Record<never, never>;

type PathParams<P extends string> = P extends `${infer Head}/${infer Tail}`
	? SegmentParams<Head> & PathParams<Tail>
	: SegmentParams<P>;

type PathsForView<
	R extends Record<string, string>,
	V extends R[keyof R],
> = Extract<
	{
		[P in keyof R]: R[P] extends V ? P : never;
	}[keyof R],
	string
>;

type ParamsForPaths<P extends string> = P extends unknown
	? PathParams<P>
	: never;

type AllKeys<T> = T extends unknown ? keyof T : never;

type ParamsForView<R extends Record<string, string>, V extends R[keyof R]> =
	ParamsForPaths<PathsForView<R, V>> extends infer P
		? {
				[K in keyof P]: P[K];
			} & {
				[K in Exclude<AllKeys<P>, keyof P>]?: string;
			}
		: never;

type RouteInfos = typeof routeInfos;

export type ViewId = RouteInfos[keyof RouteInfos];

export type RouteParams<V extends ViewId> = ParamsForView<RouteInfos, V>;

type PathWildcard = string | number;

type PathParts<P extends string> = P extends "/"
	? []
	: P extends `/${infer Rest}`
		? PathParts<Rest>
		: P extends `${infer Head}/${infer Tail}`
			? [Head extends `:${string}` ? PathWildcard : Head, ...PathParts<Tail>]
			: [P extends `:${string}` ? PathWildcard : P];

type LeaguePathParts<P extends string> = P extends "/l/:lid"
	? []
	: P extends `/l/:lid/${infer Rest}`
		? PathParts<Rest>
		: never;

type LinkParts<R extends Record<string, string>> = {
	[P in keyof R]: P extends string ? LeaguePathParts<P> : never;
}[keyof R];

type MakeWildcardOptional<T, U = T> = T extends [...infer Init, PathWildcard]
	? Extract<U, Init> extends never
		? T
		: [...Init, PathWildcard | undefined]
	: T;

export type LeagueUrlParts = MakeWildcardOptional<LinkParts<RouteInfos>>;
// Param names of each league route of view V, as a union with one tuple per route, so the names of different routes don't merge into one union
type RouteParamNameSets<V extends ViewId> =
	PathsForView<RouteInfos, V> extends infer P
		? P extends string
			? [Exclude<keyof PathParams<P>, "lid">]
			: never
		: never;

type IsExactlyOneOf<Key, Sets> = Sets extends [infer Names]
	? [Key] extends [Names]
		? [Names] extends [Key]
			? true
			: never
		: never
	: never;

// Whether a route of view V has exactly the params named in Key
export type MatchesRouteParams<V extends ViewId, Key extends string> =
	true extends IsExactlyOneOf<Key, RouteParamNameSets<V>> ? true : false;
