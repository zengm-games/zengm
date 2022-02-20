import RatingsStatsPopover from "./RatingsStatsPopover";
import SkillsBlock from "./SkillsBlock";
import { helpers } from "../util";
import type { Player, PlayerInjury } from "../../common/types";
import InjuryIcon from "./InjuryIcon";
import SeasonIcons from "../views/Player/SeasonIcons";

type Props = {
	awards?: Player["awards"];
	jerseyNumber?: string;
	injury?: PlayerInjury & {
		playingThrough?: boolean;
	};
	pos?: string;
	pid?: number;

	// season is passed to RatingsStatsPopover only, where it's used to determine whether to show a historical season's data
	season?: number;

	skills?: string[];
	style?: {
		[key: string]: string;
	};
	watch?: boolean;

	firstName?: string;
	lastName?: string;
	firstNameShort?: string;

	// Pass to override firstName and lastName
	legacyName?: string;
};

const parseLegacyName = (name: string) => {
	const parts = name.split(" (")[0].split(" ");
	let lastName = parts.at(-1);

	// For "Bob Smith Jr." and similar names, return "Smith" not "Jr."
	// Eventually should probably unify this with the code in tools/names.js
	const suffixes = ["Jr", "Jr.", "Sr", "Sr."];

	if (
		parts.length > 2 &&
		(suffixes.includes(lastName) || lastName === lastName.toUpperCase())
	) {
		lastName = parts[parts.length - 2];
	}
	const firstName = parts.slice(0, parts.indexOf(lastName)).join(" ");

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

const PlayerNameLabels = (props: Props) => {
	const {
		awards,
		firstNameShort,
		injury,
		jerseyNumber,
		pid,
		pos,
		season,
		skills,
		style,
		watch,
	} = props;

	let { firstName, lastName } = getFirstLastNames(props);

	// See if we need to truncate skills
	let numSkillsBeforeTruncate;
	if (window.mobile && firstNameShort && skills) {
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
			{firstNameShort ? (
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
			{props.hasOwnProperty("jerseyNumber") ? (
				<span className="text-muted jersey-number-name d-none d-sm-inline-block">
					{jerseyNumber}
				</span>
			) : null}
			{typeof pos === "string" ? `${pos} ` : null}
			{pid !== undefined ? (
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
				<RatingsStatsPopover pid={pid} season={season} watch={watch} />
			) : null}
		</span>
	);

	if (awards) {
		return (
			<div className="d-flex">
				{nameLabelsBlock}
				<div className="ms-auto">
					<SeasonIcons className="ms-1" awards={awards} playoffs />
					<SeasonIcons className="ms-1" awards={awards} />
				</div>
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
