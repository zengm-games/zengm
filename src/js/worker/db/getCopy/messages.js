import {idb} from '../../db';
import {mergeByPk} from './helpers';
import type {Message, MessageWithMid} from '../../../common/types';

const getCopy = async ({
    mid,
}: {
    mid?: number,
} = {}): Promise<(Message | MessageWithMid | (Message | MessageWithMid)[])> => {
    if (mid !== undefined) {
        let message = await idb.cache.messages.get(mid);
        if (!message) {
            message = await idb.league.messages.get(mid);
        }
        return message;
    }
    return mergeByPk(
        await idb.league.messages.getAll(),
        await idb.cache.messages.getAll(),
        idb.cache.storeInfos.messages.pk,
    );
};

export default getCopy;
