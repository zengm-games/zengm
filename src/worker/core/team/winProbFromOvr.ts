// Convert a team-ovr difference (teamA.ovr - teamB.ovr, on the 0-100 scale) into
// team A's win probability. Logistic fit; OVR_WINP_SCALE is a first-pass constant
// (~one ovr point ≈ a few % at the margin) and can be tuned.
const OVR_WINP_SCALE = 12;

const winProbFromOvr = (ovrDiff: number): number => {
	return 1 / (1 + Math.exp(-ovrDiff / OVR_WINP_SCALE));
};

export default winProbFromOvr;
