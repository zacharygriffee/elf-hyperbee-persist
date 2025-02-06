import {from, map, toArray} from "rxjs";
import {filterNil} from "@ngneat/elf";

/**
 * Creates an observable that loads persisted state from a Hyperbee instance and updates an elfStore.
 *
 * This function reads state entries from Hyperbee within a specified key range (defined by the prefix)
 * and maps each entry to update the provided elfStore. The keys in Hyperbee are expected to be stored as
 * arrays where the first element is the prefix and the second element is the actual key.
 *
 * @param {Hyperbee} hyperbee - The Hyperbee instance to read the persisted state from. It must implement
 *   a `createReadStream` method that accepts a range query.
 * @param {Observable|Store} elfStore - The store to update with the persisted state. This object must provide an
 *   `update` method that accepts a function to update the current state.
 * @param {Object} [options={}] - Optional configuration options.
 * @param {string} [options.prefix="state"] - The prefix used to filter keys in Hyperbee. The observable will
 *   read keys that are greater than this prefix and less than this prefix concatenated with "~".
 * @returns {Observable} An RxJS Observable which, upon subscription, reads entries from Hyperbee and updates the
 *   elfStore with each key/value pair retrieved.
 */
const loadStateFromHyperbee$ = (hyperbee, elfStore, { prefix = "state" } = {}) =>
    from(hyperbee.createReadStream({ gte: prefix == null ? undefined : [prefix] })).pipe(
        filterNil(),
        map(({ key, value }) => elfStore.update(state => ({...state, [prefix == null ? key : key[1]]: value}))),
        toArray(),
        map(() => elfStore)
    );

export { loadStateFromHyperbee$ };