import PropTypes from "prop-types";
import React from "react";
import { SKILLS } from "../../common/constants";

const tooltips = SKILLS;

const SkillsBlock = ({
	className,
	skills,
}: {
	className?: string;
	skills?: string[];
}) => {
	if (skills === undefined) {
		return null;
	}

	return (
		<span className={className}>
			{skills.map(skill => (
				<span
					key={skill}
					className="skill"
					title={
						// https://github.com/microsoft/TypeScript/issues/21732
						// @ts-ignore
						tooltips.hasOwnProperty(skill) ? tooltips[skill].description : null
					}
				>
					{skill}
				</span>
			))}
		</span>
	);
};

SkillsBlock.propTypes = {
	className: PropTypes.string,
	skills: PropTypes.arrayOf(PropTypes.string),
};

export default SkillsBlock;
