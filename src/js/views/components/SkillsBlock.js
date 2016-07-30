const React = require('react');

const SkillsBlock = ({skills}) => {
    if (skills === undefined) {
        return null;
    }

    const tooltips = {
        "3": "Three Point Shooter",
        A: "Athlete",
        B: "Ball Handler",
        Di: "Interior Defender",
        Dp: "Perimeter Defender",
        Po: "Post Scorer",
        Ps: "Passer",
        R: "Rebounder",
    };

    return <span>
        {skills.map(skill => <span key={skill} className="skill" title={tooltips[skill]}>{skill}</span>)}
    </span>;
};
SkillsBlock.propTypes = {
    skills: React.PropTypes.arrayOf(React.PropTypes.string),
};

module.exports = SkillsBlock;
