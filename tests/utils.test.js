import {pluck, arrayDiff, uniqBy, renameProp} from '../src/js/utils';

it('pluck a value from object', () => {
  expect(pluck('a')({a: 1, b: 2})).toEqual(1);
  expect(pluck('c')({a: 1, b: 2})).toEqual(undefined);
});

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

describe('rename properties', () => {
  it('renames a property', () => {
    expect(renameProp('old', 'new')({old: 1, untouched: 2})).toEqual({
      new: 1,
      untouched: 2,
    });
  });

  it('leaves the object unchanged if property is not present', () => {
    expect(renameProp('old', 'new')({unknown: 1, untouched: 2})).toEqual({
      unknown: 1,
      untouched: 2,
    });
  });

  it('overrides an existing property if clashes with new name', () => {
    expect(renameProp('old', 'new')({old: 1, new: 2})).toEqual({new: 1});
  });
});
