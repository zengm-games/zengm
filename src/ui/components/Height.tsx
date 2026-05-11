import { local, useLocalPartial } from "../util/local.ts";

export const getHeightString = (inches: number, units: "metric" | "us") => {
	if (units === "metric") {
		return `${Math.round(inches * 2.54)} cm`;
	}

	return `${Math.floor(inches / 12)}'${inches % 12}"`;
};

export const Height = ({ inches }: { inches: number }) => {
	const { units } = useLocalPartial(["units"]);

	return getHeightString(inches, units);
};

export const wrappedHeight = (inches: number) => {
	const units = local.getState().units;
	const string = getHeightString(inches, units);

	return {
		value: string,
		sortValue: inches,
	};
};
