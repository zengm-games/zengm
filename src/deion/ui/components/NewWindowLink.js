// @flow

import PropTypes from "prop-types";
import React, { useCallback } from "react";
import { helpers } from "../util";

type Props = {
    parts?: (number | string)[],
};

const NewWindowLink = ({ parts }: Props) => {
    const handleClick = useCallback(() => {
        const url = parts ? helpers.leagueUrl(parts) : document.URL;

        // Window name is set to the current time, so each window has a unique name and thus a new window is always opened
        window.open(
            `${url}?w=popup`,
            Date.now(),
            "height=600,width=800,scrollbars=yes",
        );
    }, [parts]);

    return (
        <img
            alt="Open In New Window"
            className="new_window"
            title="Open In New Window"
            height="16"
            width="16"
            onClick={handleClick}
            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA0AAAANABeWPPlAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFOSURBVDiNlZS9isJAFIU/F6s0m0VYYiOrhVukWQsbK4t9CDtbexGs8xY+ghY+QRBsbKcTAjZaqKyGXX2Bs00S1AwBD1yYOXPvmXvv/CAJSQAuoGetzAPCMKRSqTzSOURRRK/Xo1wqldyEewXwfR/P8zLHIAhYr9fZ3BjDeDym1WoBUAZ+i3ZaLBYsl8s7zhiTCbwk3DfwaROYz+fsdjs6nU7GOY6TjVOBGPixCbiuy2g0YrVa0Ww2c+svlpg7DAYDptMp3W6XyWRi9RHwRXKMh8NBKYbDoQC1221dr1dtNhv1+33NZjMZY9KjtAsEQSBAvu/rfD7rEYUC2+1WjuOo0Whov9/ngm8FchcJoFarEYYhnudRrVYLe5QTOJ1OANTrdQCOx6M1MI5jexOftdsMLsBbYb7wDkTAR+KflWC9hRakr+wi6e+2hGfNTb+Bf9965Lxmndc1AAAAAElFTkSuQmCC"
        />
    );
};

NewWindowLink.propTypes = {
    parts: PropTypes.arrayOf(
        PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    ),
};

export default NewWindowLink;
