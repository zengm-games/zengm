import PropTypes from "prop-types";
import { useLocalShallow } from "../util";

const Weight = ({ pounds }: { pounds: number }) => {
	const state = useLocalShallow(state2 => ({
		units: state2.units,
	}));

	if (state.units === "metric") {
		return `${Math.round(pounds / 2.205)} kg`;
	}

	return `${pounds} lbs`;
};

Weight.propTypes = {
	pounds: PropTypes.number.isRequired,
};

export default Weight;
