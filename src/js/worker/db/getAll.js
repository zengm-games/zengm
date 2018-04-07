// @flow

// With cb, to avoid reading all into memory. Without cb, because Chrome crashes on large getAlls.
const getAll = async (
    store: any,
    key: any,
    cb?: any => boolean,
): Promise<any[]> => {
    const objs = [];
    await store.iterate(key, obj => {
        if (cb === undefined || cb(obj)) {
            objs.push(obj);
        }
    });
    return objs;
};

export default getAll;
