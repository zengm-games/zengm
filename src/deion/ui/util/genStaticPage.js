import React from "react";
import initView from "./initView";
import setTitle from "./setTitle";

const genStaticPage = (
    name: string,
    title: string,
    content: React.Element<*>,
    inLeague: boolean,
) => {
    return initView({
        id: name,
        inLeague,
        Component: () => {
            setTitle(title);

            return content;
        },
    });
};

export default genStaticPage;
