import type { Conditions, UpdateEvents } from "../../common/types.ts";
import type { RouteParams, ViewId } from "../../ui/router/types.ts";

type EmptyObject = Record<never, never>;

// Turns the URL parameters for a view into the inputs to the view. Can return { redirectUrl } instead to redirect.
type ProcessInputs<Id extends ViewId> = (
	params: RouteParams<Id>,
	ctxBBGM: any,
) => object | undefined;

// Output of a processInputs function, or an empty object if there is none
export type ViewInput<P> = P extends (...args: any) => infer Inputs
	? Exclude<Inputs, { redirectUrl: string } | undefined>
	: EmptyObject;

// The argument of a worker view function. P is the type of the view's processInputs function, if it has one. See defineView for details.
export type ViewArgs<P = undefined, Keep = EmptyObject> = {
	inputs: ViewInput<P>;
	updateEvents: UpdateEvents;
	prevInputs: ViewInput<P> | undefined;
	prevOutput: Partial<Keep>;
	conditions: Conditions;
};

type ViewFunction<P, Keep, Data> = (
	args: ViewArgs<P, Keep>,
) => Data | Promise<Data>;

// A view can return nothing (no update needed), and if it returns one of the properties listed in the keepPrevOutput option, the type must match what it declared there
type ViewData<Keep> = void | (Partial<Keep> & Record<string, unknown>);

type ViewDefinition<Id extends ViewId, P, Keep, Data> = {
	id: Id;
	processInputs?: P;
	keepPrevOutput?: Keep;
	load: ViewFunction<P, Keep, Data>;
};

// Use in the keepPrevOutput option of defineView to declare the type of a property. There is no actual value, the only thing that exists at runtime is the key.
export const keepType = <T>() => undefined as unknown as T;

/**
 * Define a worker view.
 *
 * - id: one of the ids in routeInfos
 * - processInputs: function that turns the URL parameters into the inputs passed to load, or returns { redirectUrl }
 * - keepPrevOutput: properties of the returned data that are kept and passed back to load next time, as prevOutput. The values are only there to declare the types, using keepType.
 * - load: function that loads the data for the view. It receives an object containing:
 *     - inputs: output of processInputs, or an empty object if there is none
 *     - updateEvents
 *     - prevInputs: inputs from the last time this view ran, or undefined if the page was not already loaded
 *     - prevOutput: properties of the previously returned data that are listed in the keepPrevOutput option. Could be missing, like on the first run. This is everything the view has returned since the page was loaded, merged together, so a property can come from an earlier run than the last one.
 *     - conditions
 *
 * The keepPrevOutput option is needed because the type of prevOutput can't be inferred from what load returns, since what it returns can depend on prevOutput. So declare the type here and then it's checked against what load actually returns:
 *
 *     defineView({
 *         id: "schedule",
 *         processInputs,
 *         keepPrevOutput: { completed: keepType<Game[]>() },
 *         load: async ({ inputs, updateEvents, prevOutput }) => { ... },
 *     })
 */
export const defineView = <
	Id extends ViewId,
	Data extends ViewData<Keep>,
	P extends ProcessInputs<Id> | undefined = undefined,
	Keep extends Record<string, unknown> = EmptyObject,
>(
	definition: ViewDefinition<Id, P, Keep, Data>,
) => {
	return {
		...definition,

		// Only these properties of the data previously returned by this view are sent back from the UI, as prevOutput
		keepPrevOutputKeys: definition.keepPrevOutput
			? Object.keys(definition.keepPrevOutput)
			: undefined,
	};
};
