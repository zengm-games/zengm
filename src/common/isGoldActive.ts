// For subscribers who have not renewed yet, give them a 3 day grace period before showing ads again, because sometimes it takes a little extra time for the payment to process
const GRACE_PERIOD = 60 * 60 * 24 * 3;

// goldUntil is a Unix timestamp in seconds, from the account server
export const isGoldActive = (goldUntil: number) => {
	const currentTimestamp = Math.floor(Date.now() / 1000) - GRACE_PERIOD;
	return currentTimestamp <= goldUntil;
};
