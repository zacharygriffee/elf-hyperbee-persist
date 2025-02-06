import { deepEqual, pairwiseStartWith } from "./utils/index.js";
import { concatMap, debounceTime, distinctUntilChanged, finalize, tap } from "rxjs";

const defaultCas = (prev, curr) => !deepEqual([prev.key, prev.value], [curr.key, curr.value]);
const defaultDistinct = ([prev, curr]) => deepEqual(prev, curr);

/**
 * Creates an observable pipeline that persists state changes to a Hyperbee.
 *
 * This function sets up an observable pipeline on the provided `elfStore`, which emits state updates.
 * It compares consecutive state snapshots using `pairwiseStartWith`, debounces rapid updates, and only
 * processes changes when the state has actually changed (using `distinctUntilChanged`).
 *
 * For each new state, it iterates over the state object's key/value pairs and persists each entry to the
 * Hyperbee, using a composite key formed by the provided prefix (if applicable) and the individual key.
 *
 * @param {Hyperbee} hyperbee - The Hyperbee instance used for state persistence. It must expose a `put` method
 *   that accepts a composite key and a value.
 * @param {Observable|Store} elfStore - An observable or store that represents the current state. This object
 *   must support the `pipe` method and have a `getValue()` method to retrieve the current state.
 * @param {Object} [options={}] - Optional configuration options.
 * @param {string|null} [options.prefix="state"] - The prefix to be used when constructing the composite key for each
 *   state entry. If `null`, keys will be stored directly in Hyperbee.
 * @param {number} [options.debounce=1000] - The debounce time in milliseconds to wait before processing state updates.
 * @param {function} [options.cas=defaultCas] - A compare-and-swap (CAS) function that determines whether an entry
 *   should be updated in Hyperbee. It takes two parameters (`prev`, `curr`) and should return `true` if an update is needed.
 * @param {function} [options.distinct=defaultDistinct] - A function used for `distinctUntilChanged`, determining whether
 *   state updates are considered distinct. It takes two consecutive state values and returns `true` if they are equal.
 * @returns {Observable} An RxJS Observable that, upon subscription, processes state updates from the `elfStore`
 *   and persists each key/value pair to Hyperbee.
 */
const persistStateIntoHyperbee$ = (hyperbee, elfStore, { prefix = "state", debounce = 1000, cas: _cas = defaultCas, distinct = defaultDistinct } = {}) =>
    elfStore.pipe(
        pairwiseStartWith(elfStore.getValue()),
        debounceTime(debounce),
        distinctUntilChanged(distinct),
        concatMap(async ([, nextState]) => {
            for (const [key, value] of Object.entries(nextState)) {
                await hyperbee.put(prefix == null ? key : [prefix, key], value, { cas: _cas });
            }
            return nextState;
        })
    );

export { persistStateIntoHyperbee$ };
