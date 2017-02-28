// @flow

import g from '../../../globals';
import {idb} from '../../db';
import {mergeByPk} from './helpers';
import type {Message, MessageWithMid} from '../../../common/types';

const getCopy = async (): Promise<(Message | MessageWithMid)[]> => {
    return mergeByPk(
        await idb.league.messages.getAll(),
        await g.cache.getAll('messages'),
        g.cache.storeInfos.messages.pk,
    );
};

export default getCopy;
