import type { MetaAttributes } from "./connectMeta.ts";
import { idb } from "./index.ts";

export const getMetaAttribute = async <Key extends keyof MetaAttributes>(
	key: Key,
) => {
	// The attributes store only knows that its values are one of the MetaAttributes values, not which one goes with which key
	return (await idb.meta.get("attributes", key)) as
		| MetaAttributes[Key]
		| undefined;
};

export const putMetaAttribute = async <Key extends keyof MetaAttributes>(
	key: Key,
	value: MetaAttributes[Key],
) => {
	await idb.meta.put("attributes", value, key);
};
