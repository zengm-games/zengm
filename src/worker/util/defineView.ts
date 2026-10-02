import type {
	Conditions,
	UpdateEvents,
	ViewInputOrEmpty,
	ViewPrev,
} from "../../common/types.ts";
import type { ViewId } from "../../ui/router/types.ts";

type EmptyObject = Record<never, never>;

type ViewFunction<Id extends ViewId, PrevData, Data> = (
	inputs: ViewInputOrEmpty<Id>,
	updateEvents: UpdateEvents,
	prev: ViewPrev<Id, PrevData>,
	conditions: Conditions,
) => Promise<Data>;

// A view can return nothing (no update needed), and if it returns one of the properties it reads back in prev.data, the type must match what it declared
type ViewData<PrevData> = void | (Partial<PrevData> & Record<string, unknown>);

type DefinedView<Id extends ViewId, PrevData, Data> = ViewFunction<
	Id,
	PrevData,
	Data
> & {
	// Only these properties of the data previously returned by this view are sent back from the UI, in prev.data
	prevDataKeys: string[];
};

// Use in the prevData option of defineView to declare the type of a property. There is no actual value, the only thing that exists at runtime is the key.
export const prevType = <T>() => undefined as unknown as T;

/**
 * Define a worker view. id must be one of the ids in routeInfos. The view function receives:
 *
 * - inputs: output of the processInputs function for this view, if there is one
 * - updateEvents
 * - prev.inputs: inputs from the last time this view ran, or undefined if the page was not already loaded
 * - prev.data: properties of the previously returned data that are listed in the prevData option. Could be missing, like on the first run.
 * - conditions
 *
 * prevData is needed because the type of prev.data can't be inferred from what the view returns, since what it returns can depend on prev.data. So declare the type here and then it's checked against what the view actually returns:
 *
 *     defineView("schedule", { prevData: { completed: prevType<Game[]>() } }, async (inputs, updateEvents, prev) => { ... })
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
	PrevData extends Record<string, unknown>,
	Data extends ViewData<PrevData>,
>(
	id: Id,
	options: { prevData: PrevData },
	view: ViewFunction<Id, PrevData, Data>,
): DefinedView<Id, PrevData, Data>;
export function defineView(
	id: string,
	optionsOrView:
		| { prevData: Record<string, unknown> }
		| ViewFunction<any, any, any>,
	maybeView?: ViewFunction<any, any, any>,
) {
	const view = typeof optionsOrView === "function" ? optionsOrView : maybeView!;
	const prevDataKeys =
		typeof optionsOrView === "function"
			? []
			: Object.keys(optionsOrView.prevData);

	return Object.assign(view, { prevDataKeys });
}
