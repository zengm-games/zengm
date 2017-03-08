// @flow

import {idb} from '../../db';
import {mergeByPk} from './helpers';
import type {Message, MessageWithMid} from '../../../common/types';

const getCopy = async (): Promise<(Message | MessageWithMid)[]> => {
    return mergeByPk(
        await idb.league.messages.getAll(),
        await idb.cache.messages.getAll(),
        idb.cache.storeInfos.messages.pk,
    );
};

export default getCopy;
