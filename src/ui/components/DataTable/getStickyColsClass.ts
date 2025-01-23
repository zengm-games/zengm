import type { StickyColsPlusCheckboxes } from "./useStickyXX";

const getStickyColsClass = (stickyCols: StickyColsPlusCheckboxes) => {
	if (stickyCols === 4) {
		throw new Error("NOT IMPLEMENTED");
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
