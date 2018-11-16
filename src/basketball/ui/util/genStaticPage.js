import React from "react";
import { initView, setTitle } from "../../../deion/ui/util";

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
