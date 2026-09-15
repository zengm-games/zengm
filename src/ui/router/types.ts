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

type RouteInfo = typeof routeInfos;

export type RouteParams<V extends RouteInfo[keyof RouteInfo]> = ParamsForView<
	RouteInfo,
	V
>;
