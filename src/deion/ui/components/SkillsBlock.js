// @flow

import PropTypes from "prop-types";
import * as React from "react";

const tooltips =
    process.env.SPORT === "basketball"
        ? {
              "3": "Three Point Shooter",
              A: "Athlete",
              B: "Ball Handler",
              Di: "Interior Defender",
              Dp: "Perimeter Defender",
              Po: "Post Scorer",
              Ps: "Passer",
              R: "Rebounder",
          }
        : {};

const SkillsBlock = ({
    className,
    skills,
}: {
    className?: string,
    skills?: string[],
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
                        tooltips.hasOwnProperty(skill) ? tooltips[skill] : null
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
