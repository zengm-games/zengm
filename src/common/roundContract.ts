export const roundContract = (amount: number, minContract: number) => {
	if (minContract >= 3) {
		// Round to some integer
		// 30-299 -> 1 digit (thousands)
		// 300-2999 -> 2 digits (tens of thousands)
		// 3000-29999 -> 3 digits (hundreds of thousands)
		// ...etc
		const numDigits = Math.floor(Math.log10(minContract / 3));

		// 1 digit -> 1
		// 2 digits -> 10
		// 3 digits -> 100
		// ...etc
		const roundAmount = 10 ** (numDigits - 1);

		return roundAmount * Math.round(amount / roundAmount);
	}

	// Maybe could be fractional, but let's not worry about that unless someone asks
	return Math.round(amount);
};
