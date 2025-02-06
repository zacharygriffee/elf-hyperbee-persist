import {deepEqual, pairwiseStartWith} from "./utils/index.js";
import {concatMap, debounceTime, distinctUntilChanged, finalize, tap} from "rxjs";

/**
 * Creates an observable pipeline that persists state changes to a Hyperbee.
 *
 * This function sets up an observable pipeline on the provided `elfStore` which emits state updates.
 * It compares consecutive state snapshots using `pairwiseStartWith`, debounces rapid updates, and only
 * processes changes when the state has actually changed (using `distinctUntilChanged` with a deep equality check).
 * For each new state, it iterates over the state object's key/value pairs and persists each entry to the
 * Hyperbee, using a composite key formed by the provided prefix and the individual key.
 *
 * @param {Hyperbee} hyperbee - The Hyperbee instance used for state persistence. It must expose a `put` method
 *   that accepts a composite key and a value.
 * @param {Observable|Store} elfStore - An observable or store that represents the current state. This object
 *   must support the `pipe` method and have a `getValue()` method to retrieve the current state.
 * @param {Object} [options={}] - Optional configuration options.
 * @param {string} [options.prefix="state"] - The prefix to be used when constructing the composite key for each
 *   state entry. Each key persisted in Hyperbee will be in the form of `[prefix, key]`.
 * @param {number} [options.debounce=1000] - The debounce time in milliseconds to wait before processing state updates.
 * @returns {Observable} An RxJS Observable that, upon subscription, processes state updates from the `elfStore`
 *   and persists each key/value pair to the Hyperbee.
 */
const persistStateIntoHyperbee$ = (hyperbee, elfStore, { prefix = "state", debounce = 1000 } = {}) =>
    elfStore.pipe(
        pairwiseStartWith(elfStore.getValue()),
        debounceTime(debounce),
        distinctUntilChanged(deepEqual),
        concatMap(async ([, nextState]) => {
            for (const [key, value] of Object.entries(nextState)) await hyperbee.put(prefix == null ? key : [prefix, key], value);
            return nextState;
        })
    );

export {persistStateIntoHyperbee$};