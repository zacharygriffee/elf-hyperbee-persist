import {test, solo} from "brittle";
import {createStore, setProp, withProps} from "@ngneat/elf";
import Hyperbee from "hyperbee";
import Hypercore from "hypercore";
import RAM from "random-access-memory";
import {
    loadStateFromHyperbee$,
    loadStateThenPersistStateFromHyperbee$, persistStateIntoHyperbee$,
    stringStringIndexEncoding
} from "./lib/index.js";
import {addEntities, withEntities} from "@ngneat/elf-entities";
import {firstValueFrom, from, mergeAll, toArray} from "rxjs";



test("Test persist state with prefix", async t => {
    // Subscribe to the persistence observable
    const testStore = createStore({name: "TEST_DEBUG_1"}, withProps(), withEntities());
    const db = new Hyperbee(new Hypercore(RAM), {keyEncoding: stringStringIndexEncoding, valueEncoding: "json"});
    const sub = loadStateThenPersistStateFromHyperbee$(db, testStore, { prefix: "test1", debounce: 1 }).subscribe();

    // Update the test store with new data
    testStore.update(
        setProp("hello", "world"),
        addEntities({ id: "fun", name: "entity" })
    );

    // Allow time for persistence to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Retrieve stored entries from Hyperbee
    const dbEntries = await firstValueFrom(from(db.createReadStream({ gte: ["test1"] })).pipe(toArray()));

    // Expected entries for verification
    const expectedEntries = [
        { key: "entities", value: { fun: { id: "fun", name: "entity" } } },
        { key: "hello", value: "world" },
        { key: "ids", value: ["fun"] }
    ];

    // Ensure the number of stored entries matches expectations
    if (dbEntries.length !== expectedEntries.length) {
        t.fail(`Entries length mismatch: Expected ${expectedEntries.length}, got ${dbEntries.length}`);
    }

    // Validate each entry in the database
    for (const { key: [, dbKey], value: dbValue } of dbEntries) {
        const entry = expectedEntries.find(({ key }) => dbKey === key);
        if (!entry) {
            t.fail(`Entry with key '${dbKey}' not found in expected entries`);
        }
        t.alike(dbValue, entry.value);
    }

    // Load persisted state into a new store for verification
    const sinkStore = createStore({ name: "sink" });
    const state = await firstValueFrom(
        loadStateFromHyperbee$(db, sinkStore, { prefix: "test1", debounce: 1 }).pipe(mergeAll())
    );

    // Assert that the loaded state matches expectations
    t.alike(state, {
        entities: { fun: { id: "fun", name: "entity" } },
        hello: "world",
        ids: ["fun"]
    });

    // Cleanup
    t.teardown(async () => {
        sub.unsubscribe();
        await db.close();
        await db.core.purge();
    });
});


test("Test persist state no prefix", async t => {
    // Subscribe to the persistence observable
    const testStore = createStore({name: "TEST_DEBUG_2"}, withProps(), withEntities());
    const db = new Hyperbee(new Hypercore(RAM), {keyEncoding: "utf8", valueEncoding: "json"});
    const sub = loadStateThenPersistStateFromHyperbee$(db, testStore, { prefix: null, debounce: 1 }).subscribe();

    // Update the test store with new data
    testStore.update(
        setProp("hello", "world"),
        addEntities({ id: "fun", name: "entity" })
    );

    // Allow time for persistence to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Retrieve stored entries from Hyperbee
    const dbEntries = await firstValueFrom(from(db.createReadStream()).pipe(toArray()));

    // Expected entries for verification
    const expectedEntries = [
        { key: "entities", value: { fun: { id: "fun", name: "entity" } } },
        { key: "hello", value: "world" },
        { key: "ids", value: ["fun"] }
    ];

    // Ensure the number of stored entries matches expectations
    if (dbEntries.length !== expectedEntries.length) {
        t.fail(`Entries length mismatch: Expected ${expectedEntries.length}, got ${dbEntries.length}`);
    }

    // Validate each entry in the database
    for (const { key: dbKey, value: dbValue } of dbEntries) {
        const entry = expectedEntries.find(({ key }) => dbKey === key);
        if (!entry) {
            t.fail(`Entry with key '${dbKey}' not found in expected entries`);
        }
        t.alike(dbValue, entry.value);
    }

    // Load persisted state into a new store for verification
    const sinkStore = createStore({ name: "sink" });
    const state = await firstValueFrom(
        loadStateFromHyperbee$(db, sinkStore, { prefix: null, debounce: 1 }).pipe(mergeAll())
    );

    // Assert that the loaded state matches expectations
    t.alike(state, {
        entities: { fun: { id: "fun", name: "entity" } },
        hello: "world",
        ids: ["fun"]
    });

    // Cleanup
    t.teardown(async () => {
        sub.unsubscribe();
        await db.close();
        await db.core.purge();
    });
});

test("Same values won't up seq", async t => {
    const testStore = createStore({name: "TEST_DEBUG_3"}, withProps());
    const db = new Hyperbee(new Hypercore(RAM), {keyEncoding: "utf8", valueEncoding: "json"});
    from(db.createHistoryStream({live: true})).subscribe(console.log);
    const sub = persistStateIntoHyperbee$(db, testStore, {prefix: null, debounce: 1}).subscribe();
    testStore.update(state => ({hello: "world"}));
    await new Promise(resolve => setTimeout(resolve, 100));
    const {seq: a} = await db.get("hello");
    t.is(a, 1);
    testStore.update(state => ({hello: "world"}));
    await new Promise(resolve => setTimeout(resolve, 100));
    const {seq: b} = await db.get("hello");
    t.is(b, 1);
    t.teardown(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        sub.unsubscribe();
    });
});