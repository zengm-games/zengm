import PropTypes from "prop-types";
import { local, useLocal } from "../util";

const getWeightString = (pounds: number, units: "metric" | "us") => {
	if (typeof pounds !== "number") {
		return null;
	}

	if (units === "metric") {
		return `${Math.round(pounds / 2.205)} kg`;
	}

	return `${pounds} lbs`;
};

const Weight = ({ pounds }: { pounds: number }) => {
	const units = useLocal(state2 => state2.units);

	return getWeightString(pounds, units);
};

Weight.propTypes = {
	pounds: PropTypes.number,
};

export default Weight;

export const wrappedWeight = (pounds: number) => {
	const units = local.getState().units;
	const string = getWeightString(pounds, units);

	return {
		value: string,
		sortValue: pounds,
	};
};
