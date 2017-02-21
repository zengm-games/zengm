// @flow

import g from '../../globals';
import {mergeByPk} from './helpers';
import type {Message, MessageWithMid} from '../../util/types';

const getCopy = async (): Promise<(Message | MessageWithMid)[]> => {
    return mergeByPk(
        await g.dbl.messages.getAll(),
        await g.cache.getAll('messages'),
        g.cache.storeInfos.messages.pk,
    );
};

export default getCopy;
