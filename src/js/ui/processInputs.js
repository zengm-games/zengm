const account = (ctx) => {
    return {
        goldMessage: ctx.bbgm.goldResult !== undefined ? ctx.bbgm.goldResult.message : undefined,
        goldSuccess: ctx.bbgm.goldResult !== undefined ? ctx.bbgm.goldResult.success : undefined,
    };
};

const deleteLeague = (ctx) => {
    return {
        lid: parseInt(ctx.params.lid, 10),
    };
};

export {
    account,
    deleteLeague,
};
