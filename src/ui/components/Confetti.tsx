// @ts-ignore
import ConfettiGenerator from "confetti-js";
import { useEffect, useState } from "react";

// https://stackoverflow.com/a/5624139/786644
const hexToRgb = (hex: string) => {
	// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
	const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	hex = hex.replace(shorthandRegex, function (m, r, g, b) {
		return r + r + g + g + b + b;
	});

	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? [
				parseInt(result[1], 16),
				parseInt(result[2], 16),
				parseInt(result[3], 16),
		  ]
		: undefined;
};

const Confetti = ({ colors }: { colors?: [string, string, string] }) => {
	const [clicked, setClicked] = useState(false);

	useEffect(() => {
		const confettiSettings = {
			target: "confetti",
			colors: colors ? colors.map(hexToRgb) : undefined,
			rotate: true,
			size: 2,
		};
		const confetti = new ConfettiGenerator(confettiSettings);
		confetti.render();

		return () => confetti.clear();
	}, [colors]);

	if (clicked) {
		return null;
	}

	return (
		<canvas
			id="confetti"
			onClick={() => {
				setClicked(true);
			}}
		></canvas>
	);
};

export default Confetti;
