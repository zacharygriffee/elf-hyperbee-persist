# elf-hyperbee-persist

**elf-hyperbee-persist** is a library for managing state persistence and synchronization between a [Hyperbee](https://github.com/hypercore-protocol/hyperbee) instance and an [RxJS Elf](https://github.com/ngneat/elf) store. These utilities ensure that state changes are efficiently loaded and persisted using reactive programming principles.

## Features

- **State Persistence**: Automatically save changes from an Elf store into Hyperbee.
- **State Loading**: Retrieve existing state entries from Hyperbee into the Elf store.
- **Support for Prefixed and Non-Prefixed Keys**: Works with both structured `[prefix, key]` formats and direct keys.
- **Efficient Updates**: Uses RxJS to minimize redundant writes and optimize performance.
- **Deep Equality Checks**: Ensures that only actual state changes are persisted.
- **Composable RxJS Pipelines**: Designed to be easily integrated with other reactive workflows.

---

## Installation

Install the package via npm:

```sh
npm install elf-hyperbee-persist
```

---

## API

### `loadStateFromHyperbee$`

```js
import { loadStateFromHyperbee$ } from "elf-hyperbee-persist";
```

Loads persisted state from Hyperbee into an RxJS Elf store.

#### Parameters:
- `hyperbee`: The Hyperbee instance to read the state from.
- `elfStore`: The store where the loaded state will be applied.
- `options.prefix` _(default: `"state"`)_: If provided, filters keys that start with this prefix.
    - If `prefix` is `null`, keys are assumed to be stored as direct keys instead of `[prefix, key]`.

#### Returns:
An RxJS observable that, when subscribed to, loads the state into the Elf store.

#### Example Usage:
```js
// Using prefixed keys
loadStateFromHyperbee$(hyperbeeInstance, myElfStore, { prefix: "gameState" }).subscribe();

// Using non-prefixed keys
loadStateFromHyperbee$(hyperbeeInstance, myElfStore, { prefix: null }).subscribe();
```

---

### `persistStateIntoHyperbee$`

```js
import { persistStateIntoHyperbee$ } from "elf-hyperbee-persist";
```

Watches for state changes in the Elf store and persists them into Hyperbee.

#### Parameters:
- `hyperbee`: The Hyperbee instance to persist the state into.
- `elfStore`: The RxJS Elf store tracking state changes.
- `options.prefix` _(default: `"state"`)_: If provided, persists state using `[prefix, key]` format.
    - If `prefix` is `null`, stores keys directly without structuring them as arrays.
- `options.debounce` _(default: `1000`)_: Debounce time in milliseconds before persisting updates.

#### Returns:
An RxJS observable that processes state updates and saves them to Hyperbee.

#### Example Usage:
```js
// Using prefixed keys
persistStateIntoHyperbee$(hyperbeeInstance, myElfStore, { prefix: "gameState" }).subscribe();

// Using non-prefixed keys
persistStateIntoHyperbee$(hyperbeeInstance, myElfStore, { prefix: null }).subscribe();
```

---

### `loadStateThenPersistStateFromHyperbee$`

```js
import { loadStateThenPersistStateFromHyperbee$ } from "elf-hyperbee-persist";
```

Combines `loadStateFromHyperbee$` and `persistStateIntoHyperbee$` in sequence.

#### Parameters:
- `hyperbee`: The Hyperbee instance.
- `elfStore`: The Elf store to synchronize.
- `options.prefix` _(default: `"state"`)_: If provided, applies a prefix to stored and retrieved keys.
- `options.debounce` _(default: `1000`)_: Debounce time before persisting changes.

#### Returns:
An RxJS observable that first loads the state and then starts persisting subsequent changes.

#### Example Usage:
```js
// Using prefixed keys
loadStateThenPersistStateFromHyperbee$(hyperbeeInstance, myElfStore, { prefix: "gameState" }).subscribe();

// Using non-prefixed keys
loadStateThenPersistStateFromHyperbee$(hyperbeeInstance, myElfStore, { prefix: null }).subscribe();
```

---

## Utilities

### `stringStringIndexEncoding`
```js
import { stringStringIndexEncoding } from "elf-hyperbee-persist";
```
A utility that provides encoding for string-based Hyperbee keys.

---

### `deepEqual`
```js
import { deepEqual } from "elf-hyperbee-persist";
```
Performs a deep equality check between two objects to detect changes efficiently.

#### Example:
```js
deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 }); // true
deepEqual({ a: 1 }, { a: 1, b: 2 }); // false
```

---

### `pairwiseStartWith`
```js
import { pairwiseStartWith } from "elf-hyperbee-persist";
```
An RxJS operator that emits previous and current values, starting with an initial state.

#### Example:
```js
myObservable.pipe(pairwiseStartWith(initialState));
```

---

## How It Works

1. **State Loading**:
    - `loadStateFromHyperbee$` reads stored state from Hyperbee.
    - The state is merged into an RxJS Elf store.
    - Supports both prefixed `[prefix, key]` structures and direct keys.

2. **State Watching & Persistence**:
    - `persistStateIntoHyperbee$` listens for changes in the Elf store.
    - Uses `deepEqual` to avoid unnecessary writes.
    - Debounces updates to optimize performance.
    - Saves only changed entries into Hyperbee.
    - Supports direct key storage when `prefix` is `null`.

3. **Full Integration**:
    - `loadStateThenPersistStateFromHyperbee$` ensures that state is first loaded before persistence starts.

---

## License

This project is released under the MIT License.