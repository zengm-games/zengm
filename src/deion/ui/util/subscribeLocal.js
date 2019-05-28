// @flow

import React from "react";
import { Subscribe } from "unstated";
import local from "./local";

const subscribeLocal = (cb: any) => {
    return <Subscribe to={[local]}>{local2 => cb(local2)}</Subscribe>;
};

export default subscribeLocal;
