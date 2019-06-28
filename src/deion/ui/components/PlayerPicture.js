// @flow

import faces from "facesjs";
import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";

const imgStyle = { maxHeight: "100%", maxWidth: "100%" };

const PlayerPicture = ({ face, imgURL }: { face: any, imgURL: ?string }) => {
    const [wrapper, setWrapper] = useState(null);

    useEffect(() => {
        if (face && !imgURL && wrapper) {
            faces.display(wrapper, face);
        }
    }, [face, imgURL, wrapper]);

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
};

export default PlayerPicture;
