export function uniqBy<T = unknown>(
  array: T[],
  comparator: (a: T) => string
): T[] {
  return array.filter(function (value, index, self) {
    return (
      self.findIndex(function (item) {
        return comparator(item) === comparator(value);
      }) === index
    );
  });
}
