import type { StickyCols } from ".";

const getStickyColsClass = (stickyCols: StickyCols) => {
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
