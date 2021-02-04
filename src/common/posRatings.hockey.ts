const posRatings = (pos: string) => {
	if (pos === "G") {
		return ["glk"];
	}

	return ["pss", "wst", "sst", "stk", "oiq", "chk", "blk", "fcf", "diq"];
};

export default posRatings;
