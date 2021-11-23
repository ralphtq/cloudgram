// pluck a property from an object
export const pluck =
  <T>(prop: keyof NonNullable<T>) =>
  (obj: NonNullable<T>) =>
    obj[prop];

// compute the difference between two arrays returning
// all elements from arr1 that are not present in arr2
export const arrayDiff = <T>(arr1: T[], arr2: T[]) => {
  const _difference = new Set(arr1);
  for (const elem of new Set(arr2)) {
    _difference.delete(elem);
  }
  return [..._difference];
};

// find unique objects in an array using an optional key function
// default is to look for the property id of the objects
export const uniqBy = <T>(array: NonNullable<T>[], keyFn = pluck<T>('id' as any)) => {
  const seen = new Set();
  return array.filter(item => {
    const k = keyFn(item);
    return seen.has(k) ? false : seen.add(k);
  });
};

// Grab the document definition for the query parameters
export const getDocumentFromUrl = () => new URLSearchParams(window.location.search).get('document');
