
module.exports.sortByAsc = function sortByAsc(
    arr,
    comparator
) {
    return [...arr].sort((a, b) => {
        if (comparator(a) < comparator(b)) {
            return -1;
        }
        if (comparator(a) > comparator(b)) {
            return 1;
        }
        return 0;
    });
}
