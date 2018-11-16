// @flow

import { idb } from "..";
import type { Message } from "../../../../deion/common/types";

const getCopy = async ({ mid }: { mid: number }): Promise<Message | void> => {
    const result = await idb.getCopies.messages({ mid });
    return result[0];
};

export default getCopy;
