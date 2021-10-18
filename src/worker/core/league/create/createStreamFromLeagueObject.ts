import { CUMULATIVE_OBJECTS } from "../../../api/leagueFileUpload";

// Silly to stream this, since leagueObject is already in memory, but this allows us to unify the input to league creation
const createStreamFromLeagueObject = (
	leagueObject: Record<string, unknown>,
) => {
	const keys = Object.keys(leagueObject);
	let i: number = 0;
	let j: number = 0;

	const readableStream = new ReadableStream({
		pull(controller) {
			const key = keys[i];

			if (key === undefined) {
				controller.close();
			}

			const object = leagueObject[key];

			if (CUMULATIVE_OBJECTS.has(key)) {
				controller.enqueue({
					key,
					value: object,
				});
			} else {
				const row = (object as any)[j];
				if (row !== undefined) {
					controller.enqueue({
						key,
						value: row,
					});
				} else {
					i += 1;
					j = 0;
				}
			}
		},
	});

	return readableStream;
};

export default createStreamFromLeagueObject;
