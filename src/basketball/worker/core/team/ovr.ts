import { helpers } from "../../../../deion/worker/util";

const ovr = (
	players: {
		ratings: {
			ovr: number;
			pos: string;
		};
	}[],
) => {
	const ovrs = players.map(p => p.ratings.ovr).sort((a, b) => b - a);

	while (ovrs.length < 10) {
		ovrs.push(0);
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
		0.4417 * Math.exp(-0.1905 * 0) * ovrs[0] +
		0.4417 * Math.exp(-0.1905 * 1) * ovrs[1] +
		0.4417 * Math.exp(-0.1905 * 2) * ovrs[2] +
		0.4417 * Math.exp(-0.1905 * 3) * ovrs[3] +
		0.4417 * Math.exp(-0.1905 * 4) * ovrs[4] +
		0.4417 * Math.exp(-0.1905 * 5) * ovrs[5] +
		0.4417 * Math.exp(-0.1905 * 6) * ovrs[6] +
		0.4417 * Math.exp(-0.1905 * 7) * ovrs[7] +
		0.4417 * Math.exp(-0.1905 * 8) * ovrs[8] +
		0.4417 * Math.exp(-0.1905 * 9) * ovrs[9];

	// Translate from -20/20 to 0/100 scale
	const rawOVR = (predictedMOV * 50) / 20 + 50;
	return helpers.bound(Math.round(rawOVR), 0, Infinity);
};

export default ovr;
