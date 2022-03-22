// Ideally, firstNameShort should be the first letter of a name, like "A." for Allen. But if there is an Allen and an Arnold with the same last name, it should be "Al." and "Ar.". See addFirstNameShort.test.ts for more.

import { groupBy } from "../../common/groupBy";

class TrieNode {
	key: string | undefined;
	parent: TrieNode | undefined;
	children: Record<string, TrieNode>;
	numChildren: number;
	numHere: number;

	constructor(key: string | undefined, parent: TrieNode | undefined) {
		this.key = key;
		this.parent = parent;
		this.children = {};
		this.numChildren = 0;
		this.numHere = 0;
	}
}

class Trie {
	root: TrieNode;

	constructor() {
		this.root = new TrieNode(undefined, undefined);
	}

	add(word: string) {
		let node = this.root;

		for (const char of word) {
			if (!node.children[char]) {
				node.children[char] = new TrieNode(char, node);
			}
			node.numChildren += 1;
			node.children[char].numHere += 1;
			node = node.children[char];
		}
	}

	findAbbrev(word: string) {
		let length = 0;
		let bestYetLength = 0;
		let bestYetNumHere = Infinity;
		let node = this.root;
		for (const char of word) {
			node = node.children[char];
			length += 1;

			// This is a potential candidate if there are fewer distinct names at this node
			if (node.numHere < bestYetNumHere) {
				bestYetLength = length;
				bestYetNumHere = node.numChildren;
			}
		}

		// If there are still other children after this word is complete, that means there is another name that is this name plus extra characters, so show all of this name
		if (node.numChildren > 0) {
			bestYetLength = length;
			bestYetNumHere = node.numChildren;
		}

		if (bestYetLength >= word.length - 1) {
			return word;
		}

		return `${word.slice(0, bestYetLength)}.`;
	}
}

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
	const playersByLastName = groupBy(players, "lastName");

	const tries: Record<string, Trie | undefined> = {};
	for (const [lastName, playersGroup] of Object.entries(playersByLastName)) {
		if (playersGroup.length <= 1 || lastName === "") {
			continue;
		}

		// Find the minimum number of letters needed to distinguish these first names

		const trie = new Trie();
		for (const p of playersGroup) {
			trie.add(p.firstName);
		}
		tries[lastName] = trie;
	}

	return players.map(p => {
		let firstNameShort;
		const trie = tries[p.lastName];
		if (!trie) {
			if (p.firstName.length <= 2 || p.lastName === "") {
				firstNameShort = p.firstName;
			} else {
				firstNameShort = `${p.firstName.slice(0, 1)}.`;
			}
		} else {
			firstNameShort = trie.findAbbrev(p.firstName);
		}

		return {
			...p,
			firstNameShort,
		};
	});
};

export default addFirstNameShort;
