// There are a bunch of places where formatRecord is not used and it's done manually :(

const formatRecord = ({
	won,
	lost,
	tied,
	otl,
}: {
	won: number;
	lost: number;
	tied?: number;
	otl?: number;
}) => {
	let record = `${won}-${lost}`;
	if (typeof otl === "number" && !Number.isNaN(otl) && otl > 0) {
		record += `-${otl}`;
	}
	if (typeof tied === "number" && !Number.isNaN(tied) && tied > 0) {
		record += `-${tied}`;
	}

	return record;
};

export default formatRecord;
