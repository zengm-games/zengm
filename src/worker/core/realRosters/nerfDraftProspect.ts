const nerfDraftProspect = (ratings: {
	endu: number;
	diq: number;
	oiq: number;
}) => {
	const decreaseRating = (name: keyof typeof ratings, amount: number) => {
		if (ratings[name] > amount) {
			ratings[name] -= amount;
		} else {
			ratings[name] = 0;
		}
	};

	// Arbitrarily copied from nicidob
	decreaseRating("endu", 5);
	decreaseRating("diq", 4);
	decreaseRating("oiq", 4);
};

export default nerfDraftProspect;
