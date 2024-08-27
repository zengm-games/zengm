import clsx from "clsx";
import { local, useLocal } from "../util";
import { PLAYER } from "../../common";

type Props = {
	change?: number;
	rating: number;

	// This should be the current tid, so we know if the player is retired or not. Don't pass if not easily available. This is only used for challengeNoRatings.
	tid?: number;
};

const getChangeText = (change: number) => {
	return ` (${change > 0 ? "+" : ""}${change})`;
};

const Rating = ({ change, rating, tid }: Props) => {
	const challengeNoRatings = useLocal(state => state.challengeNoRatings);

	if (challengeNoRatings && tid !== PLAYER.RETIRED) {
		// Hide rating if challengeNoRatings is enabled, except for retired players
		return null;
	}

	return (
		<>
			{rating}
			{change !== 0 && change !== undefined ? (
				<span
					className={clsx({
						"text-success": change > 0,
						"text-danger": change < 0,
					})}
				>
					{getChangeText(change)}
				</span>
			) : null}
		</>
	);
};

export const wrappedRating = (props: Props) => {
	const challengeNoRatings = local.getState().challengeNoRatings;

	if (challengeNoRatings && props.tid !== PLAYER.RETIRED) {
		// Hide rating if challengeNoRatings is enabled, except for retired players
		return null;
	}

	return {
		value: <Rating {...props} />,
		searchValue: `${props.rating}${props.change !== 0 && props.change !== undefined ? getChangeText(props.change) : ""}}`,
		sortValue:
			props.rating + (props.change === undefined ? 0 : props.change / 1000),
	};
};

export default Rating;
