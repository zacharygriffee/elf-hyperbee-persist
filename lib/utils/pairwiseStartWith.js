import {pipe, pairwise, startWith} from "rxjs";

const pairwiseStartWith = start => pipe(
    startWith(start),
    pairwise()
);

export { pairwiseStartWith };