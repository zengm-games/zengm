const posRatings = (pos: string) => {
	if (pos === "SP" || pos === "RP" || pos === "P") {
		return ["ppw", "ctl", "mov", "endu"];
	}

	// Fake depth chart positions
	if (pos === "L" || pos === "D") {
		return ["hpw", "con", "eye", "gnd", "fly", "thr", "cat"];
	}

	if (pos === "C") {
		return ["hpw", "con", "eye", "thr", "cat"];
	}

	return ["hpw", "con", "eye", "gnd", "fly", "thr"];
};

export default posRatings;
