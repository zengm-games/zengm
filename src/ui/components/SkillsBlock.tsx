import { useId } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { bySport } from "../../common";
import { useLocal } from "../util";

const tooltips = bySport({
	baseball: {
		Pp: "Power Pitcher",
		Pf: "Finesse Pitcher",
		Pw: "Workhorse Pitcher",
		Ri: "Infield Range",
		Ro: "Outfield Range",
		Dc: "Catcher Defense",
		D1: "First Base Defense",
		Dg: "Ground Ball Fielding",
		Df: "Fly Ball Fielding",
		A: "Strong Arm",
		Hp: "Power Hitter",
		Hc: "Contact Hitter",
		E: "Good Eye",
		S: "Speed",
	},
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

	const tooltipId = useId();

	return (
		<OverlayTrigger
			overlay={
				<Tooltip id={tooltipId}>
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
	const fullNames = useLocal(state => state.fullNames);

	if (skills === undefined) {
		return null;
	}

	const truncate =
		!fullNames &&
		numSkillsBeforeTruncate !== undefined &&
		skills.length > numSkillsBeforeTruncate;
	const truncatedSkills = truncate
		? skills.slice(0, numSkillsBeforeTruncate)
		: skills;

	return (
		<span className={className}>
			{truncatedSkills.map(skill => (
				<span key={skill} className="skill" title={(tooltips as any)[skill]}>
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
