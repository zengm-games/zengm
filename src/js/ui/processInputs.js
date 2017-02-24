const deleteLeague = (ctx) => {
    return {
        lid: parseInt(ctx.params.lid, 10),
    };
};

export {
    deleteLeague,
};
