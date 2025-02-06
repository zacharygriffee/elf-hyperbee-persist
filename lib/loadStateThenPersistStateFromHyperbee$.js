import {loadStateFromHyperbee$} from "./loadStateFromHyperbee$.js";
import {concat, tap} from "rxjs";
import {persistStateIntoHyperbee$} from "./persistStateIntoHyperbee$.js";

/**
 * Loads state from Hyperbee and then persists state changes.
 *
 * This function concatenates two observables:
 * 1. `loadStateFromHyperbee$` - Loads the persisted state from Hyperbee into the provided store.
 * 2. `persistStateIntoHyperbee` - Persists any subsequent state changes from the store into Hyperbee.
 *
 * The concatenation ensures that state is fully loaded before starting to persist further changes.
 *
 * @param {Hyperbee} hyperbee - The Hyperbee instance for storage.
 * @param {Observable|Store} elfStore - The state store that provides updates and a `getValue()` method.
 * @param {Object} [options={}] - Optional configuration options.
 * @param {string} [options.prefix="state"] - The prefix used when constructing keys for Hyperbee.
 * @param {number} [options.debounce=1000] - The debounce time (in ms) for persisting state changes.
 * @returns {Observable} An observable that, when subscribed to, loads the state and then persists subsequent changes.
 */
const loadStateThenPersistStateFromHyperbee$ = (hyperbee, elfStore, { prefix = "state", debounce = 1000 } = {}) =>
    concat(
        loadStateFromHyperbee$(hyperbee, elfStore, {prefix}),
        persistStateIntoHyperbee$(hyperbee, elfStore, {prefix, debounce})
    );

export {loadStateThenPersistStateFromHyperbee$};