// @flow

import { display } from "facesjs";
import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";

const imgStyle = { maxHeight: "100%", maxWidth: "100%" };

const PlayerPicture = ({
    face,
    imgURL,
    teamColors,
}: {
    face: any,
    imgURL: string | void,
    teamColors: [string, string, string] | void,
}) => {
    const [wrapper, setWrapper] = useState(null);

    useEffect(() => {
        if (face && !imgURL && wrapper) {
            const overrides = {
                teamColors: teamColors ? teamColors : ["#000", "#ccc", "#fff"],
            };

            display(wrapper, face, overrides);
        }
    }, [face, imgURL, teamColors, wrapper]);

    if (imgURL) {
        return <img alt="Player" src={imgURL} style={imgStyle} />;
    }

    if (face) {
        return <div ref={setWrapper} />;
    }

    return null;
};

PlayerPicture.propTypes = {
    face: PropTypes.object,
    imgURL: PropTypes.string,
    teamColors: PropTypes.arrayOf(PropTypes.string),
};

export default PlayerPicture;
