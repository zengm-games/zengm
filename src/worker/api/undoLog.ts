import local from "../util/local.ts";

const remove = (undoKey: number) => {
	return local.undoLog.remove(undoKey);
};

const undo = (undoKey: number) => {
	return local.undoLog.undo(undoKey);
};

export default {
	remove,
	undo,
};
