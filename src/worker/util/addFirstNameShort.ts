// Ideally, firstNameShort should be the first letter of a name, like "A." for Allen. But if there is an Allen and an Arnold with the same last name, it should be "Al." and "Ar.". See addFirstNameShort.test.ts for more.

import { groupBy } from "../../common/groupBy";

const addFirstNameShort = <
	T extends {
		firstName: string;
		lastName: string;
	},
>(
	players: T[],
): (T & {
	firstNameShort: string;
})[] => {
	console.log(players);
	const playersByLastName = groupBy(players, "lastName");

	const lengthNeeded: Record<string, number> = {};
	for (const [lastName, playersGroup] of Object.entries(playersByLastName)) {
		if (playersGroup.length <= 1) {
			lengthNeeded[lastName] = 1;
			continue;
		}

		// Find the minimum number of letters needed to distinguish these first names

		const firstNames = playersGroup.map(p => p.firstName);
		const maxLength = Math.max(
			...firstNames.map(firstName => firstName.length),
		);

		let prevNumUniqueNames = 0;
		for (let length = 1; length <= maxLength; length++) {
			const truncated = firstNames.map(firstName => firstName.slice(0, length));
			const numUniqueNames = new Set(truncated).size;

			if (numUniqueNames === firstNames.length) {
				// Every player has a unique name!
				lengthNeeded[lastName] = length;
				break;
			}

			// Not all are unique yet, but keep track of the minimum length needed to achieve this level of uniqueness, so like if it's Jason and Jason they get abbreviated as J rather than Jason
			if (numUniqueNames > prevNumUniqueNames) {
				lengthNeeded[lastName] = length;
				prevNumUniqueNames = numUniqueNames;
			}
		}
	}

	return players.map(p => {
		let firstNameShort;
		if (p.firstName.length <= lengthNeeded[p.lastName] + 1) {
			firstNameShort = p.firstName;
		} else {
			firstNameShort = `${p.firstName.slice(0, lengthNeeded[p.lastName])}.`;
		}

		return {
			...p,
			firstNameShort,
		};
	});
};

export default addFirstNameShort;
