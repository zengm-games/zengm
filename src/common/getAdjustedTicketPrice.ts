export const PLAYOFF_ATTENDANCE_FACTOR = 1.5;

// In the playoffs, auto-adjust ticket price up, accounting for the increase in baseAttendance
const getAdjustedTicketPrice = (ticketPrice: number, playoffs: boolean) => {
	if (!playoffs) {
		return ticketPrice;
	}

	return Math.sqrt(PLAYOFF_ATTENDANCE_FACTOR) * ticketPrice;
};

export default getAdjustedTicketPrice;
