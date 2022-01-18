import { local, useLocal } from "../util";

export const getHeightString = (inches: number, units: "metric" | "us") => {
	if (units === "metric") {
		return `${Math.round(inches * 2.54)} cm`;
	}

	return `${Math.floor(inches / 12)}'${inches % 12}"`;
};

const Height = ({ inches }: { inches: number }) => {
	const units = useLocal(state2 => state2.units);

	return getHeightString(inches, units) as unknown as JSX.Element;
};

export default Height;

export const wrappedHeight = (inches: number) => {
	const units = local.getState().units;
	const string = getHeightString(inches, units);

	return {
		value: string,
		sortValue: inches,
	};
};
