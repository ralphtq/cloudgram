import {arrayDiff, uniqBy} from './utils';

it('return missing elements from second list', () => {
  expect(arrayDiff([1, 2, 3], [2, 3])).toEqual([1]);
  expect(arrayDiff([1, 2, 3], [])).toEqual([1, 2, 3]);
  expect(arrayDiff([1, 2, 3], [1, 2, 3])).toEqual([]);
  expect(arrayDiff([1, 2, 3], [1, 2, 3, 4])).toEqual([]);
  expect(arrayDiff([], [1, 2, 3, 4])).toEqual([]);
});

describe('unique by', () => {
  it('leaves empty array untouched', () => {
    expect(uniqBy([], ({id}) => id)).toEqual([]);
  });

  it('leaves arrays with no duplicates untouched', () => {
    expect(
      uniqBy(
        [
          {id: 1, a: 2},
          {id: 2, a: 2},
        ],
        ({id}) => id
      )
    ).toEqual([
      {id: 1, a: 2},
      {id: 2, a: 2},
    ]);
  });

  it('find unique elements by key keeping the first one', () => {
    expect(
      uniqBy(
        [
          {id: 1, a: 2},
          {id: 1, a: 3},
        ],
        ({id}) => id
      )
    ).toEqual([{id: 1, a: 2}]);
  });

  it('collapses all elements without a key to one', () => {
    expect(
      uniqBy(
        [
          {id: 1, a: 2},
          {id: 1, a: 3},
          {unknown: 2, a: 4},
        ],
        ({unknown}) => unknown
      )
    ).toEqual([
      {id: 1, a: 2},
      {unknown: 2, a: 4},
    ]);
  });

  it('defaults to id as key', () => {
    expect(
      uniqBy([
        {id: 1, a: 2},
        {id: 1, a: 3},
      ])
    ).toEqual([{id: 1, a: 2}]);
  });
});
