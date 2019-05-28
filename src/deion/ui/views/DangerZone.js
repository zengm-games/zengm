// @flow

import React from "react";
import { setTitle, toWorker } from "../util";

const DangerZone = () => {
    setTitle("Danger Zone");

    return (
        <>
            <h1>Danger Zone</h1>

            <p className="alert alert-danger">
                <b>Warning!</b> This stuff might break your league! It's only
                here in case your league is already broken, in which case
                sometimes these drastic measures might save it.
            </p>

            <p>
                <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                        toWorker("actions.toolsMenu.skipToPlayoffs");
                    }}
                >
                    Skip To Playoffs
                </button>
            </p>
            <p>
                <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                        toWorker("actions.toolsMenu.skipToBeforeDraft");
                    }}
                >
                    Skip To Before Draft
                </button>
            </p>
            <p>
                <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                        toWorker("actions.toolsMenu.skipToAfterDraft");
                    }}
                >
                    Skip To After Draft
                </button>
            </p>
            <p>
                <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                        toWorker("actions.toolsMenu.skipToPreseason");
                    }}
                >
                    Skip To Preseason
                </button>
            </p>
        </>
    );
};

export default DangerZone;
