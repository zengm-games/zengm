import orderBy from 'lodash.orderby';
import unionBy from 'lodash.unionby';
import {deepCopy} from '../../util/helpers';

// Merge fromDb and fromCache by primary key, and sort. Records in fromCache will overwrite records in fromDb. Return value is cloned.
const mergeByPk = (fromDb: any[], fromCache: any[], pk: string) => {
    return orderBy(unionBy(deepCopy(fromCache), fromDb, pk), pk);
};

export {
    // eslint-disable-next-line import/prefer-default-export
    mergeByPk,
};
