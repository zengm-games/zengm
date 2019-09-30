// @flow

import { idb } from "..";

const getCopy = async ({
    season,
}: {
    season: number,
}): Promise<Object | void> => {
    console.log("getCopy", season);
    const result = await idb.getCopies.allStars({ season });
    console.log(result);
    return result[0];
};

export default getCopy;
