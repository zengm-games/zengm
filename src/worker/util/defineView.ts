import type { Conditions, UpdateEvents } from "../../common/types.ts";
import type processInputs from "../api/processInputs.ts";
import type { ViewId } from "../../ui/router/types.ts";

type EmptyObject = Record<never, never>;

export type ViewInput<T extends keyof typeof processInputs> = Exclude<
	ReturnType<(typeof processInputs)[T]>,
	{ redirectUrl: string }
>;

// Like ViewInput, but works for views with no processInputs function too
type ViewInputOrEmpty<T extends string> = T extends keyof typeof processInputs
	? ViewInput<T>
	: EmptyObject;

// The argument of a worker view function. See defineView for details.
export type ViewArgs<T extends string, Keep = EmptyObject> = {
	inputs: ViewInputOrEmpty<T>;
	updateEvents: UpdateEvents;
	prevInputs: ViewInputOrEmpty<T> | undefined;
	prevOutput: Partial<Keep>;
	conditions: Conditions;
};

type ViewFunction<Id extends ViewId, Keep, Data> = (
	args: ViewArgs<Id, Keep>,
) => Data | Promise<Data>;

// A view can return nothing (no update needed), and if it returns one of the properties listed in the keepPrevOutput option, the type must match what it declared there
type ViewData<Keep> = void | (Partial<Keep> & Record<string, unknown>);

type DefinedView<Id extends ViewId, Keep, Data> = ViewFunction<
	Id,
	Keep,
	Data
> & {
	// Keys of the keepPrevOutput option. Only these properties of the data previously returned by this view are sent back from the UI, as prevOutput
	keepPrevOutputKeys: string[];
};

// Use in the keepPrevOutput option of defineView to declare the type of a property. There is no actual value, the only thing that exists at runtime is the key.
export const keepType = <T>() => undefined as unknown as T;

/**
 * Define a worker view. id must be one of the ids in routeInfos. The view function receives an object containing:
 *
 * - inputs: output of the processInputs function for this view, if there is one
 * - updateEvents
 * - prevInputs: inputs from the last time this view ran, or undefined if the page was not already loaded
 * - prevOutput: properties of the previously returned data that are listed in the keepPrevOutput option. Could be missing, like on the first run. This is everything the view has returned since the page was loaded, merged together, so a property can come from an earlier run than the last one.
 * - conditions
 *
 * The keepPrevOutput option is needed because the type of prevOutput can't be inferred from what the view returns, since what it returns can depend on prevOutput. So declare the type here and then it's checked against what the view actually returns:
 *
 *     defineView("schedule", { keepPrevOutput: { completed: keepType<Game[]>() } }, async ({ inputs, updateEvents, prevOutput }) => { ... })
 */
export function defineView<
	Id extends ViewId,
	Data extends ViewData<EmptyObject>,
>(
	id: Id,
	view: ViewFunction<Id, EmptyObject, Data>,
): DefinedView<Id, EmptyObject, Data>;
export function defineView<
	Id extends ViewId,
	Keep extends Record<string, unknown>,
	Data extends ViewData<Keep>,
>(
	id: Id,
	options: { keepPrevOutput: Keep },
	view: ViewFunction<Id, Keep, Data>,
): DefinedView<Id, Keep, Data>;
export function defineView(
	id: string,
	optionsOrView:
		| { keepPrevOutput: Record<string, unknown> }
		| ViewFunction<any, any, any>,
	maybeView?: ViewFunction<any, any, any>,
) {
	const view = typeof optionsOrView === "function" ? optionsOrView : maybeView!;
	const keepPrevOutputKeys =
		typeof optionsOrView === "function"
			? []
			: Object.keys(optionsOrView.keepPrevOutput);

	return Object.assign(view, { keepPrevOutputKeys });
}
