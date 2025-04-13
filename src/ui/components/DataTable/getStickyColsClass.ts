import type { StickyColsPlusCheckboxes } from "./useStickyXX.ts";

const getStickyColsClass = (stickyCols: StickyColsPlusCheckboxes) => {
	if (stickyCols === 4) {
		// This is only used when showBulkSelectCheckboxes adds 1 extra column to sticky-xxx - no other way to select it in the UI
		return "sticky-iv";
	}
	if (stickyCols === 3) {
		return "sticky-xxx";
	}
	if (stickyCols === 2) {
		return "sticky-xx";
	}
	if (stickyCols === 1) {
		return "sticky-x";
	}
};

export default getStickyColsClass;
