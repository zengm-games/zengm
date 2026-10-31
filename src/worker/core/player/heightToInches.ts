// Convert hgt rating to height in inches, for sports other than basketball (which generates height in inches first, and then the rating from that). 0 to 100 is 5'4" to 6'10"
export const heightToInches = (hgt: number) => {
	return Math.round(64 + (hgt * (82 - 64)) / 100);
};
