// @flow

import { idb } from "..";
import type { Awards } from "../../../../basketball/common/types";

const getCopy = async ({
    season,
}: {
    season: number,
}): Promise<Awards | void> => {
    const result = await idb.getCopies.awards({ season });
    return result[0];
};

export default getCopy;
