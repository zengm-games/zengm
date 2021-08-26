const ovr = (
	players: {
		ratings: {
			ovr: number;
			pos: string;
		};
	}[],
	{
		rating,
	}: {
		rating?: string;
	},
) => {
	const ratings = players
		.slice()
		// Sort first, so non-ovr ratings are based on the top ovr players
		.sort((a, b) => b.ratings.ovr - a.ratings.ovr)
		.map(p => {
			if (rating === undefined) {
				return p.ratings.ovr;
			}

			const val = (p.ratings as any)[rating];
			if (typeof val === "number") {
				return val;
			}

			throw new Error(`Rating not found for "${rating}"`);
		});

	while (ratings.length < 10) {
		ratings.push(0);
	}

	// See analysis/team-ovr-basketball
	// But after that, @nicidob fit the coefficients to an exponential:
	// > The code is just.. get a best-fit exponential model from the OLS data
	// >     a,b = np.polyfit(np.arange(10),np.log(np.array(res.params[1:])),1)
	// > Then use that as an initial guess for an optimizer
	// >     def best_fit_func_exp(x):
	// >         return np.linalg.norm((dataX @ np.exp(x[0]* np.arange(10))x[1]-x[2] - dataset['mov']))
	// >     res2 = opt.minimize(best_fit_func_exp,[a,np.exp(b),-125],method='Nelder-Mead')
	// >     plt.plot(np.exp(res2.x[0] np.arange(10))*res2.x[1],label='best-fit exp model',alpha=0.6)
	const predictedMOV =
		-124.13 +
		0.4417 * Math.exp(-0.1905 * 0) * ratings[0] +
		0.4417 * Math.exp(-0.1905 * 1) * ratings[1] +
		0.4417 * Math.exp(-0.1905 * 2) * ratings[2] +
		0.4417 * Math.exp(-0.1905 * 3) * ratings[3] +
		0.4417 * Math.exp(-0.1905 * 4) * ratings[4] +
		0.4417 * Math.exp(-0.1905 * 5) * ratings[5] +
		0.4417 * Math.exp(-0.1905 * 6) * ratings[6] +
		0.4417 * Math.exp(-0.1905 * 7) * ratings[7] +
		0.4417 * Math.exp(-0.1905 * 8) * ratings[8] +
		0.4417 * Math.exp(-0.1905 * 9) * ratings[9];

	if (rating) {
		// In this case, we're ultimately using the value to compute a rank, so we don't care about the scale. And bounding the scale to be positive below makes it often 0.
		return predictedMOV;
	}

	// Translate from -20/20 to 0/100 scale
	const rawOVR = (predictedMOV * 50) / 20 + 50;
	return Math.round(rawOVR);
};

export default ovr;
