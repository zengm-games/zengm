import { useId } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useLocal } from "../util/index.ts";
import { SKILLS } from "../../common/index.ts";

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
	const fullNames = useLocal((state) => state.fullNames);

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
			{truncatedSkills.map((skill) => (
				<span key={skill} className="skill" title={SKILLS[skill]}>
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
