import type { PlayerRatings } from "../../../common/types.basketball";
import { helpers } from "../../util";

const genCollegeStatsBasketball = (
	ratings: PlayerRatings,
): Record<string, number> => {
	const ratingsPCA = {
		stre: [
			-1.1957165757730195e-5,
			-4.453965364797136e-5,
			0.00010640966922795406,
		],
		spd: [-1.5212440648288379e-5, 8.55433941486269e-5, 0.0001384653780109442],
		jmp: [-1.521772287466695e-5, 8.597019189612675e-5, 0.00013909806853692463],
		endu: [-6.785704603510037e-6, 6.372144097151289e-6, 1.8332595343908894e-6],
		ins: [-9.87840453428284e-6, -9.560840707275353e-5, -1.895865125161545e-5],
		dnk: [
			-1.142622342117044e-5,
			-4.6973032434937114e-5,
			0.00015301011775222147,
		],
		ft: [-1.0577661869240935e-5, 6.593115872306804e-5, -4.0036404757528906e-5],
		fg: [-1.059031380633017e-5, 6.593871478474993e-5, -3.958149438851853e-5],
		tp: [-1.0572818214344663e-5, 6.563161248023762e-5, -4.011677983637406e-5],
		oiq: [
			-7.969437900770308e-6,
			-8.947535801699055e-6,
			-0.00010341249600635312,
		],
		diq: [-8.149386301838323e-6, -4.051564134201123e-5, -9.300493866457778e-5],
		drb: [-1.3061947879877261e-5, 3.40811567941367e-5, -0.00015104368632591029],
		pss: [
			-1.2086636169940184e-5,
			2.2431001311058523e-5,
			-0.0001690471861140337,
		],
		reb: [
			-1.258550762820505e-5,
			-9.346464479107998e-5,
			-0.00011990679173511645,
		],
		hgt: [-1.3809375087572575e-5, -0.0001352125223682471, 9.450968663108081e-5],
	};
	const pcaWeights = {
		pts: [-4951.373, -201.241, 44.672, -25.301],
		orb: [-528.388, -160.513, -2.362, -2.632],
		drb: [-1417.591, -327.953, 6.586, -6.587],
		ast: [-1186.993, 133.778, -309.548, -6.791],
		stl: [-551.645, 3.296, -4.414, -2.901],
		blk: [-237.62, -54.105, 38.411, -1.178],
		min: [-5052.907, -58.646, -28.55, -7.304],
	};
	// uhh... properties aren't string-accessible in ratings??
	const pca = [0, 1, 2].map(
		x =>
			ratings.diq * ratingsPCA.diq[x] +
			ratings.dnk * ratingsPCA.dnk[x] +
			ratings.drb * ratingsPCA.drb[x] +
			ratings.endu * ratingsPCA.endu[x] +
			ratings.fg * ratingsPCA.fg[x] +
			ratings.ft * ratingsPCA.ft[x] +
			ratings.hgt * ratingsPCA.hgt[x] +
			ratings.ins * ratingsPCA.ins[x] +
			ratings.jmp * ratingsPCA.jmp[x] +
			ratings.oiq * ratingsPCA.oiq[x] +
			ratings.pss * ratingsPCA.pss[x] +
			ratings.reb * ratingsPCA.reb[x] +
			ratings.spd * ratingsPCA.spd[x] +
			ratings.stre * ratingsPCA.stre[x] +
			ratings.tp * ratingsPCA.tp[x],
	);
	const res = {
		pts: Math.round(
			helpers.bound(
				pca[0] * pcaWeights.pts[0] +
					pca[1] * pcaWeights.pts[1] +
					pca[2] * pcaWeights.pts[2] +
					pcaWeights.pts[3],
				0,
				50,
			),
		),
		reb: Math.round(
			helpers.bound(
				pca[0] * pcaWeights.orb[0] +
					pca[1] * pcaWeights.orb[1] +
					pca[2] * pcaWeights.orb[2] +
					pcaWeights.orb[3] +
					pca[0] * pcaWeights.drb[0] +
					pca[1] * pcaWeights.drb[1] +
					pca[2] * pcaWeights.drb[2] +
					pcaWeights.drb[3],
				0,
				50,
			),
		),
		ast: Math.round(
			helpers.bound(
				pca[0] * pcaWeights.ast[0] +
					pca[1] * pcaWeights.ast[1] +
					pca[2] * pcaWeights.ast[2] +
					pcaWeights.ast[3],
				0,
				50,
			),
		),
	};
	//console.log(ratings.ovr,pca,res);
	return res;
};

export default genCollegeStatsBasketball;
