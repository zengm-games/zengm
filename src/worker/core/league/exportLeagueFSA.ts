import { idb } from "../../db";
import makeExportStream from "./makeExportStream";

const exportLeagueFSA = async (
	fileHandle: FileSystemFileHandle,
	storesInput: Parameters<typeof makeExportStream>[0],
	options: Parameters<typeof makeExportStream>[1],
) => {
	// Always flush before export, so export is current!
	await idb.cache.flush();

	const writableStream = await fileHandle.createWritable();

	const readableStream = makeExportStream(storesInput, options);
	readableStream.pipeTo(writableStream);
};

export default exportLeagueFSA;
