import RatingsStatsPopover from "./RatingsStatsPopover";
import SkillsBlock from "./SkillsBlock";
import { helpers, useLocal } from "../util";
import type { Player, PlayerInjury } from "../../common/types";
import InjuryIcon from "./InjuryIcon";
import SeasonIcons from "../views/Player/SeasonIcons";

type Props = {
	awards?: Player["awards"];
	awardsSeason?: number;
	count?: number;
	jerseyNumber?: string;
	injury?: PlayerInjury & {
		playingThrough?: boolean;
	};
	pos?: string;
	pid?: number;

	abbrev?: string;
	tid?: number;

	// season is passed to RatingsStatsPopover, where it's used to determine whether to show a historical season's data. Also team link
	season?: number;

	skills?: string[];
	style?: {
		[key: string]: string;
	};
	watch?: number;

	firstName?: string;
	lastName?: string;
	firstNameShort?: string;

	// For when we supply a pid, but we want no link to player page, like an exhibition game
	disableNameLink?: boolean;

	// Allow overriding settings, for places where we're sure there is always room
	fullNames?: boolean;

	// Pass to override firstName and lastName
	legacyName?: string;
};

const parseLegacyName = (name: string) => {
	// Used to be `const parts = name.split(" (")[0].split(" ");`, not sure why, but that messes up names with parentheses in them
	const parts = name.split(" ");
	let lastName = parts.at(-1)!;
	let lastNameIndex = parts.length - 1;

	// For "Bob Smith Jr." and similar names, return "Smith" not "Jr."
	// Eventually should probably unify this with the code in tools/names.js
	const suffixes = ["Jr", "Jr.", "Sr", "Sr."];

	if (
		parts.length > 2 &&
		(suffixes.includes(lastName) || lastName === lastName.toUpperCase())
	) {
		lastName = parts.slice(-2).join(" ");
		lastNameIndex = parts.length - 2;
	}
	const firstName = parts.slice(0, lastNameIndex).join(" ");

	return {
		firstName,
		lastName,
	};
};

const getFirstLastNames = (props: Props) => {
	let firstName: string;
	let lastName: string;
	if (props.legacyName) {
		const parts = parseLegacyName(props.legacyName);
		firstName = parts.firstName;
		lastName = parts.lastName;
	} else if (props.firstName !== undefined && props.lastName !== undefined) {
		firstName = props.firstName;
		lastName = props.lastName;
	} else {
		throw new Error("Missing firstName/lastName/legacyName");
	}

	return {
		firstName,
		lastName,
	};
};

export const CountBadge = ({ count }: { count: number }) => {
	if (count > 1) {
		return (
			<div className="ms-1">
				<span className="badge bg-secondary align-text-bottom">{count}</span>
			</div>
		);
	}

	return null;
};

const PlayerNameLabels = (props: Props) => {
	const fullNames = useLocal(state => state.fullNames) || props.fullNames;

	const {
		abbrev,
		awards,
		awardsSeason,
		count,
		disableNameLink,
		firstNameShort,
		injury,
		jerseyNumber,
		pid,
		pos,
		season,
		skills,
		style,
		tid,
		watch,
	} = props;

	let { firstName, lastName } = getFirstLastNames(props);

	// See if we need to truncate skills
	let numSkillsBeforeTruncate;
	if (window.mobile && !fullNames && firstNameShort && skills) {
		// Skills are about twice as wide as normal letters
		const injuryLength = injury && injury.gamesRemaining > 0 ? 3 : 0;
		const totalLength =
			firstNameShort.length +
			lastName.length +
			injuryLength +
			skills.length * 2;

		const targetLength = 20;

		if (totalLength > targetLength) {
			numSkillsBeforeTruncate = Math.max(
				0,
				Math.floor(
					(targetLength -
						2 -
						injuryLength -
						firstNameShort.length -
						lastName.length) /
						2,
				),
			);
		}

		if (numSkillsBeforeTruncate === 0) {
			lastName =
				lastName.slice(
					0,
					targetLength - firstNameShort.length - 4 - injuryLength,
				) + "...";
		}
	}

	const name = (
		<>
			{firstNameShort && !fullNames ? (
				<>
					<span className="d-inline-block d-sm-none">{firstNameShort}</span>
					<span className="d-none d-sm-inline">{firstName}</span>
				</>
			) : (
				firstName
			)}{" "}
			{lastName}
		</>
	);

	const nameLabelsBlock = (
		<span style={style}>
			{Object.hasOwn(props, "jerseyNumber") ? (
				<span
					className={`text-body-secondary jersey-number-name text-start${
						!fullNames ? " d-none d-sm-inline-block" : ""
					}`}
				>
					{jerseyNumber}
				</span>
			) : null}
			{typeof pos === "string" ? `${pos} ` : null}
			{!disableNameLink && pid !== undefined ? (
				<a href={helpers.leagueUrl(["player", pid])}>{name}</a>
			) : (
				name
			)}
			<InjuryIcon injury={injury} />
			<SkillsBlock
				skills={skills}
				numSkillsBeforeTruncate={numSkillsBeforeTruncate}
			/>
			{pid !== undefined ? (
				<RatingsStatsPopover
					pid={pid}
					season={season}
					watch={watch}
					disableNameLink={disableNameLink}
				/>
			) : null}
			{abbrev !== undefined && tid !== undefined ? (
				<a
					href={helpers.leagueUrl(["roster", `${abbrev}_${tid}`, season])}
					className="ms-1"
				>
					{abbrev}
				</a>
			) : null}
		</span>
	);

	if (awards) {
		return (
			<div className="d-flex">
				{nameLabelsBlock}
				<div className="ms-auto">
					<SeasonIcons
						className="ms-1"
						awards={awards}
						season={awardsSeason}
						playoffs
					/>
					<SeasonIcons className="ms-1" awards={awards} season={awardsSeason} />
				</div>
			</div>
		);
	}

	if (count !== undefined) {
		return (
			<div className="d-flex">
				<div className="me-auto">{nameLabelsBlock}</div>
				<CountBadge count={count} />
			</div>
		);
	}

	return nameLabelsBlock;
};

export const wrappedPlayerNameLabels = (props: Props) => {
	const { firstName, lastName } = getFirstLastNames(props);

	return {
		value: <PlayerNameLabels {...props} />,
		sortValue: `${lastName} ${firstName}`,
		searchValue: `${firstName} ${lastName}`,
	};
};

export default PlayerNameLabels;
