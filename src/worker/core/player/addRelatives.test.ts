import assert from "assert";
import range from "lodash-es/range";
import { PLAYER } from "../../../common";
import testHelpers from "../../../test/helpers";
import { player } from "..";
import { makeBrother, makeSon } from "./addRelatives";
import { idb } from "../../db";
import type { Relative } from "../../../common/types";

const season = 2017;

const genFathers = () => {
	return range(season - 40, season - 20).map(season2 =>
		player.generate(PLAYER.RETIRED, 50, season2, true, 15.5),
	);
};

const genBrothers = () => {
	return range(season - 5, season + 1).map(season2 =>
		player.generate(0, 50, season2, true, 15.5),
	);
};

const getPlayer = async (pid: number) => {
	const p = await idb.cache.players.get(pid);
	if (p === undefined) {
		throw new Error("Invalid pid");
	}
	return p;
};

describe("worker/core/player/addRelatives", () => {
	beforeAll(() => {
		testHelpers.resetG();
		idb.league = testHelpers.mockIDBLeague();
	});
	afterAll(() => {
		// @ts-ignore
		idb.league = undefined;
	});
	describe("makeBrother", () => {
		test("make player the brother of another player", async () => {
			await testHelpers.resetCache({
				players: [
					player.generate(PLAYER.UNDRAFTED, 20, season, true, 15.5),
					...genBrothers(),
				],
			});
			const p = await getPlayer(0);
			p.born.loc = "Fake Country";
			await makeBrother(p);
			const brothers = await idb.cache.players.indexGetAll("playersByTid", 0);
			const brother = brothers.find(b => b.relatives.length > 0);

			if (!brother) {
				throw new Error("No brother found");
			}

			assert.strictEqual(p.relatives.length, 1);
			assert.strictEqual(p.relatives[0].type, "brother");
			assert.strictEqual(p.relatives[0].pid, brother.pid);
			assert.strictEqual(brother.relatives.length, 1);
			assert.strictEqual(brother.relatives[0].type, "brother");
			assert.strictEqual(brother.relatives[0].pid, p.pid);
			assert.strictEqual(p.lastName, brother.lastName);
			assert.strictEqual(p.born.loc, brother.born.loc);
		});

		test("skip player if no possible brother exists", async () => {
			await testHelpers.resetCache({
				players: [player.generate(PLAYER.UNDRAFTED, 20, season, true, 15.5)],
			});
			const p = await getPlayer(0);
			await makeBrother(p);
			assert.strictEqual(p.relatives.length, 0);
		});

		test("handle case where target has a father", async () => {
			const initialBrothers = genBrothers();

			for (const p of initialBrothers) {
				p.relatives.push({
					type: "father",
					pid: 1,
					name: "Foo Bar",
				});
			}

			await testHelpers.resetCache({
				players: [
					player.generate(PLAYER.UNDRAFTED, 20, season, true, 15.5),
					player.generate(PLAYER.RETIRED, 50, season - 30, true, 15.5), // Father
					...initialBrothers,
				],
			});
			const p = await getPlayer(0);
			await makeBrother(p);
			const brothers = await idb.cache.players.indexGetAll("playersByTid", 0);
			const brother = brothers.find(b => b.relatives.length > 1);

			if (!brother) {
				throw new Error("No brother found");
			}

			assert.strictEqual(p.relatives.length, 2);
			assert.strictEqual(p.relatives[0].type, "father");
			assert.strictEqual(p.relatives[0].pid, 1);
			assert.strictEqual(p.relatives[1].type, "brother");
			assert.strictEqual(p.relatives[1].pid, brother.pid);
			assert.strictEqual(brother.relatives.length, 2);
			assert.strictEqual(brother.relatives[0].type, "father");
			assert.strictEqual(brother.relatives[0].pid, 1);
			assert.strictEqual(brother.relatives[1].type, "brother");
			assert.strictEqual(brother.relatives[1].pid, p.pid);
		});

		test("handle case where source has a father", async () => {
			const initialPlayer = player.generate(
				PLAYER.UNDRAFTED,
				20,
				season,
				true,
				15.5,
			);
			initialPlayer.firstName = "Foo";
			initialPlayer.lastName = "HasFather Jr.";
			initialPlayer.relatives.push({
				type: "father",
				pid: 1,
				name: "Foo HasFather",
			});
			await testHelpers.resetCache({
				players: [
					initialPlayer,
					player.generate(PLAYER.RETIRED, 50, season - 30, true, 15.5), // Father
					...genBrothers(),
				],
			});

			const father = await idb.cache.players.get(1);
			if (!father) {
				throw new Error("Missing father");
			}
			father.firstName = "Foo";
			father.lastName = "HasFather";

			const p = await getPlayer(0);
			await makeBrother(p);
			const brothers = await idb.cache.players.indexGetAll("playersByTid", 0);
			const brother = brothers.find(b => b.relatives.length > 1);

			if (!brother) {
				throw new Error("No brother found");
			}

			assert.strictEqual(p.relatives.length, 2);
			assert.strictEqual(p.relatives[0].type, "father");
			assert.strictEqual(p.relatives[0].pid, 1);
			assert.strictEqual(p.relatives[1].type, "brother");
			assert.strictEqual(p.relatives[1].pid, brother.pid);
			assert.strictEqual(brother.relatives.length, 2);
			assert.strictEqual(brother.relatives[0].type, "father");
			assert.strictEqual(brother.relatives[0].pid, 1);
			assert.strictEqual(brother.relatives[1].type, "brother");
			assert.strictEqual(brother.relatives[1].pid, p.pid);
			assert.strictEqual(p.lastName, "HasFather Jr.");
			assert.strictEqual(brother.lastName, "HasFather");
		});

		test("handle case where both have fathers", async () => {
			const players = [
				player.generate(PLAYER.UNDRAFTED, 20, season, true, 15.5),
				...genBrothers(),
			];

			for (const p of players) {
				p.relatives.push({
					type: "father",
					pid: 666,
					name: "Foo Bar",
				});
			}

			await testHelpers.resetCache({
				players,
			});
			const p = await getPlayer(0);
			await makeBrother(p);
			const brothers = await idb.cache.players.indexGetAll("playersByTid", 0);
			const brother = brothers.find(b => b.relatives.length > 1);
			assert.strictEqual(brother, undefined);
		});

		test("handle case where target has a brother", async () => {
			const initialP = player.generate(
				PLAYER.UNDRAFTED,
				20,
				season,
				true,
				15.5,
			);
			const initialBrothers = genBrothers();

			for (const p of initialBrothers) {
				p.relatives.push({
					type: "brother",
					pid: 1,
					name: "Foo Bar",
				});
			}

			await testHelpers.resetCache({
				players: [
					initialP,
					player.generate(PLAYER.RETIRED, 25, season - 5, true, 15.5), // Extra brother
					...initialBrothers,
				],
			});
			const p = await getPlayer(0);
			await makeBrother(p);
			const brothers = await idb.cache.players.indexGetAll("playersByTid", 0);
			const brother = brothers.find(b => b.relatives.length > 1);

			if (!brother) {
				throw new Error("No brother found");
			}

			assert.strictEqual(p.relatives.length, 2);
			assert.strictEqual(p.relatives[0].type, "brother");
			assert.strictEqual(p.relatives[0].pid, 1);
			assert.strictEqual(p.relatives[1].type, "brother");
			assert.strictEqual(p.relatives[1].pid, brother.pid);
			assert.strictEqual(brother.relatives.length, 2);
			assert.strictEqual(brother.relatives[0].type, "brother");
			assert.strictEqual(brother.relatives[0].pid, 1);
			assert.strictEqual(brother.relatives[1].type, "brother");
			assert.strictEqual(brother.relatives[1].pid, p.pid);
		});

		test("handle case where source has a brother", async () => {
			const initialPlayer = player.generate(
				PLAYER.UNDRAFTED,
				20,
				season,
				true,
				15.5,
			);
			initialPlayer.relatives.push({
				type: "brother",
				pid: 1,
				name: "Foo Bar",
			});
			await testHelpers.resetCache({
				players: [
					initialPlayer,
					player.generate(PLAYER.RETIRED, 25, season - 5, true, 15.5), // Extra brother
					...genBrothers(),
				],
			});
			const p = await getPlayer(0);
			await makeBrother(p);
			const brothers = await idb.cache.players.indexGetAll("playersByTid", 0);
			const brother = brothers.find(b => b.relatives.length > 1);
			assert.strictEqual(brother, undefined);
			assert.strictEqual(p.relatives.length, 1);
		});
	});
	describe("makeSon", () => {
		test("make player the son of another player", async () => {
			await testHelpers.resetCache({
				players: [
					// Son
					player.generate(PLAYER.UNDRAFTED, 20, season, true, 15.5), // Fathers
					...genFathers(),
				],
			});
			const son = await getPlayer(0);
			son.born.loc = "Fake Country";
			await makeSon(son);
			const fathers = await idb.cache.players.indexGetAll(
				"playersByTid",
				PLAYER.RETIRED,
			);
			const father = fathers.find(p => p.relatives.length > 0);

			if (!father) {
				throw new Error("No father found");
			}

			assert.strictEqual(son.relatives.length, 1);
			assert.strictEqual(son.relatives[0].type, "father");
			assert.strictEqual(son.relatives[0].pid, father.pid);
			assert.strictEqual(father.relatives.length, 1);
			assert.strictEqual(father.relatives[0].type, "son");
			assert.strictEqual(father.relatives[0].pid, son.pid);
			assert.strictEqual(son.born.loc, father.born.loc);
		});

		test("skip player if no possible father exists", async () => {
			await testHelpers.resetCache({
				players: [player.generate(PLAYER.UNDRAFTED, 20, season, true, 15.5)],
			});
			const son = await getPlayer(0);
			await makeSon(son);
			assert.strictEqual(son.relatives.length, 0);
		});

		test("skip player if he already has a father", async () => {
			await testHelpers.resetCache({
				players: [
					// Son
					player.generate(PLAYER.UNDRAFTED, 20, season, true, 15.5), // Fathers
					...genFathers(),
				],
			});
			const relFather: Relative = {
				type: "father",
				pid: 1,
				name: "Foo Bar",
			};
			const son = await getPlayer(0);
			son.relatives = [relFather];
			await makeSon(son);
			const fathers = await idb.cache.players.indexGetAll(
				"playersByTid",
				PLAYER.RETIRED,
			);
			const father = fathers.find(p => p.relatives.length > 0);
			assert(!father);
			assert.strictEqual(son.relatives.length, 1);
			assert.deepStrictEqual(son.relatives[0], relFather);
		});

		test("handle case where player already has a brother", async () => {
			await testHelpers.resetCache({
				players: [
					// Son
					player.generate(PLAYER.UNDRAFTED, 20, season, true, 15.5), // Brother
					player.generate(PLAYER.UNDRAFTED, 20, season, true, 15.5), // Fathers
					...genFathers(),
				],
			});
			const son = await getPlayer(0);
			son.relatives = [
				{
					type: "brother",
					pid: 1,
					name: "Foo Bar",
				},
			];
			await idb.cache.players.put(son);
			const brother = await getPlayer(1);
			brother.born.loc = "Fake Country";
			brother.relatives = [
				{
					type: "brother",
					pid: 0,
					name: "Foo Bar",
				},
			];
			await idb.cache.players.put(brother);
			await makeSon(son);
			const fathers = await idb.cache.players.indexGetAll(
				"playersByTid",
				PLAYER.RETIRED,
			);
			const father = fathers.find(p => p.relatives.length > 0);

			if (!father) {
				throw new Error("No father found");
			}

			const son2 = await getPlayer(0);
			const brother2 = await getPlayer(1);
			assert.strictEqual(son2.relatives.length, 2);
			assert.strictEqual(son2.relatives[0].type, "father");
			assert.strictEqual(son2.relatives[0].pid, father.pid);
			assert.strictEqual(son2.relatives[1].type, "brother");
			assert.strictEqual(son2.relatives[1].pid, brother2.pid);
			assert.strictEqual(brother2.relatives.length, 2);
			assert.strictEqual(brother2.relatives[0].type, "father");
			assert.strictEqual(brother2.relatives[0].pid, father.pid);
			assert.strictEqual(brother2.relatives[1].type, "brother");
			assert.strictEqual(brother2.relatives[1].pid, son2.pid);
			assert.strictEqual(father.relatives.length, 2);
			assert.strictEqual(father.relatives[0].type, "son");
			assert.strictEqual(father.relatives[1].type, "son");
			assert.deepStrictEqual(
				father.relatives.map(relative => relative.pid).sort(),
				[0, 1],
			);
			assert.strictEqual(brother2.born.loc, father.born.loc);
		});

		test("handle case where father already has a son", async () => {
			const initialFathers = genFathers();
			const initialOtherSons = initialFathers.map(() =>
				player.generate(0, 25, season, true, 15.5),
			);
			await testHelpers.resetCache({
				players: [
					// Son
					player.generate(PLAYER.UNDRAFTED, 20, season, true, 15.5), // Other sons (one for each potential father)
					...initialOtherSons, // Fathers
					...initialFathers,
				],
			});
			const fathers = await idb.cache.players.indexGetAll(
				"playersByTid",
				PLAYER.RETIRED,
			);
			const otherSons = await idb.cache.players.indexGetAll("playersByTid", 0);
			assert.strictEqual(fathers.length, otherSons.length);

			for (let i = 0; i < fathers.length; i++) {
				const father = fathers[i];
				const otherSon = otherSons[i];
				father.relatives.push({
					type: "son",
					pid: otherSon.pid,
					name: `${otherSon.firstName} ${otherSon.lastName}`,
				});
				otherSon.relatives.push({
					type: "father",
					pid: father.pid,
					name: `${father.firstName} ${father.lastName}`,
				});
				await idb.cache.players.put(father);
				await idb.cache.players.put(otherSon);
			}

			const son = await getPlayer(0);
			await makeSon(son);
			const fathers2 = await idb.cache.players.indexGetAll(
				"playersByTid",
				PLAYER.RETIRED,
			);
			const father = fathers2.find(p => p.relatives.length > 1);

			if (!father) {
				throw new Error("No father found");
			}

			const otherSons2 = await idb.cache.players.indexGetAll("playersByTid", 0);
			const otherSon = otherSons2.find(p => p.relatives.length > 1);

			if (!otherSon) {
				throw new Error("No other son found");
			}

			const son2 = await getPlayer(0);
			assert.strictEqual(son2.relatives.length, 2);
			assert.strictEqual(son2.relatives[0].type, "father");
			assert.strictEqual(son2.relatives[0].pid, father.pid);
			assert.strictEqual(son2.relatives[1].type, "brother");
			assert.strictEqual(son2.relatives[1].pid, otherSon.pid);
			assert.strictEqual(otherSon.relatives.length, 2);
			assert.strictEqual(otherSon.relatives[0].type, "father");
			assert.strictEqual(otherSon.relatives[0].pid, father.pid);
			assert.strictEqual(otherSon.relatives[1].type, "brother");
			assert.strictEqual(otherSon.relatives[1].pid, son2.pid);
			assert.strictEqual(father.relatives.length, 2);
			assert.strictEqual(father.relatives[0].type, "son");
			assert.strictEqual(father.relatives[1].type, "son");
			assert.deepStrictEqual(
				father.relatives.map(relative => relative.pid).sort(),
				[son2.pid, otherSon.pid],
			);
		});
	});
});
