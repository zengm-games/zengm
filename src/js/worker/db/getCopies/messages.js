// @flow

import { getAll, idb } from "..";
import { mergeByPk } from "./helpers";
import type { Message } from "../../../common/types";

const getLastEntries = <T>(arr: T[], limit: number): T[] => {
    return arr.slice(arr.length - limit);
};

const getCopies = async ({
    limit,
    mid,
}: {
    limit?: number,
    mid?: number,
} = {}): Promise<Message[]> => {
    if (mid !== undefined) {
        let message = await idb.cache.messages.get(mid);
        if (!message) {
            message = await idb.league.messages.get(mid);
        }
        return [message];
    }

    const constLimit = limit; // For flow
    if (constLimit !== undefined) {
        const fromDb: Message[] = [];

        await idb.league.messages.iterate(
            undefined,
            "prev",
            (message: Message, shortCircuit) => {
                fromDb.unshift(message);
                if (fromDb.length >= constLimit) {
                    shortCircuit();
                }
            },
        );

        const fromCache = await idb.cache.messages.getAll();

        const messages = mergeByPk(
            fromDb,
            getLastEntries(fromCache, constLimit),
            idb.cache.storeInfos.messages.pk,
        );

        // Need another getLastEntries because DB and cache will probably combine for (2 * limit) entries
        return getLastEntries(messages, constLimit);
    }

    return mergeByPk(
        await getAll(idb.league.messages),
        await idb.cache.messages.getAll(),
        idb.cache.storeInfos.messages.pk,
    );
};

export default getCopies;
