import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { bySport } from "../../common";

const tooltips = bySport({
	basketball: {
		"3": "Three Point Shooter",
		A: "Athlete",
		B: "Ball Handler",
		Di: "Interior Defender",
		Dp: "Perimeter Defender",
		Po: "Post Scorer",
		Ps: "Passer",
		R: "Rebounder",
		V: "Volume Scorer",
	},
	football: {
		Pa: "Accurate Passer",
		Pd: "Deep Passer",
		Ps: "Smart Passer",
		A: "Athletic",
		X: "Explosive Runner",
		H: "Hands",
		Bp: "Pass Blocker",
		Br: "Run Blocker",
		PR: "Pass Rusher",
		RS: "Run Stopper",
		L: "Lockdown Coverage",
	},
	hockey: {
		Pm: "Playmaker",
		Pw: "Power",
		G: "Grinder",
		E: "Enforcer",
		S: "Sniper",
	},
});

const TruncatedSkills = ({
	numSkillsBeforeTruncate,
	skills,
}: {
	numSkillsBeforeTruncate: number;
	skills: string[];
}) => {
	const remainingSkills = skills.slice(numSkillsBeforeTruncate);

	return (
		<OverlayTrigger
			overlay={
				<Tooltip id="truncated-skills">
					{numSkillsBeforeTruncate > 0 ? "..." : null}
					{remainingSkills.join(" ")}
				</Tooltip>
			}
		>
			<button className="btn btn-link p-0 skill">...</button>
		</OverlayTrigger>
	);
};

const SkillsBlock = ({
	className,
	numSkillsBeforeTruncate,
	skills,
}: {
	className?: string;
	numSkillsBeforeTruncate?: number;
	skills?: string[];
}) => {
	if (skills === undefined) {
		return null;
	}

	const truncate =
		numSkillsBeforeTruncate !== undefined &&
		skills.length > numSkillsBeforeTruncate;
	const truncatedSkills = truncate
		? skills.slice(0, numSkillsBeforeTruncate)
		: skills;

	return (
		<span className={className}>
			{truncatedSkills.map(skill => (
				<span
					key={skill}
					className="skill"
					title={
						// https://github.com/microsoft/TypeScript/issues/21732
						// @ts-expect-error
						tooltips.hasOwnProperty(skill) ? tooltips[skill] : null
					}
				>
					{skill}
				</span>
			))}
			{truncate ? (
				<TruncatedSkills
					skills={skills}
					numSkillsBeforeTruncate={numSkillsBeforeTruncate}
				/>
			) : null}
		</span>
	);
};

export default SkillsBlock;
