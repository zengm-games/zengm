import PropTypes from "prop-types";
import { useLocalShallow } from "../util";

const Height = ({ inches }: { inches: number }) => {
	const state = useLocalShallow(state2 => ({
		units: state2.units,
	}));

	if (state.units === "metric") {
		return `${Math.round(inches * 2.54)} cm`;
	}

	return `${Math.floor(inches / 12)}'${inches % 12}"`;
};

Height.propTypes = {
	inches: PropTypes.number.isRequired,
};

export default Height;
