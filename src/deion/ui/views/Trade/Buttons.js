// @flow

import React from "react";

const Buttons = ({
    asking,
    enablePropose,
    forceTrade,
    godMode,
    handleClickAsk,
    handleClickClear,
    handleClickForceTrade,
    handleClickPropose,
}: {
    asking: boolean,
    enablePropose: boolean,
    forceTrade: boolean,
    godMode: boolean,
    handleClickAsk: Function,
    handleClickClear: Function,
    handleClickForceTrade: Function,
    handleClickPropose: Function,
}) => {
    return (
        <>
            {godMode ? (
                <div>
                    <label className="god-mode god-mode-text">
                        <input
                            type="checkbox"
                            onClick={handleClickForceTrade}
                            value={forceTrade}
                        />
                        Force Trade
                    </label>
                </div>
            ) : null}
            <div>
                <button
                    type="submit"
                    className="btn btn-primary mt-2"
                    disabled={!enablePropose && !forceTrade}
                    onClick={handleClickPropose}
                    style={{ margin: "5px 5px 5px 0" }}
                >
                    Propose Trade
                </button>
            </div>
            <div>
                <button
                    type="submit"
                    className="btn btn-secondary mt-1"
                    disabled={asking}
                    onClick={handleClickAsk}
                    style={{ margin: "5px 5px 5px 0" }}
                >
                    {asking
                        ? "Waiting for answer..."
                        : "What would make this deal work?"}
                </button>
            </div>
            <div>
                <button
                    type="submit"
                    className="btn btn-secondary mt-1"
                    onClick={handleClickClear}
                    style={{ margin: "5px 5px 5px 0" }}
                >
                    Clear Trade
                </button>
            </div>
        </>
    );
};

export default Buttons;
