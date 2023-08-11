export class BinaryTree<T>
{
    private root? : Node<T>;
    /**
     * Comparator for type provided. Does basic < > === comparison on x and y,
     * but can be overwriten by setting a different callback that returns 1, 0 and -1
     * @param x First item to compare
     * @param y Second item to compare
     * @param z Optional information needed to compare
     * @returns 1 If x > y, -1 if x < y, 0 if x === y
     */
    public compare : (x : T, y : T, z? : any) => number = (x, y) =>
    {
        if (x === y) return 0;
        if (x > y) return 1;

        return -1;
    };
}

class Node<T>
{
    left? : Node<T>;
    right? : Node<T>;
    data = [];
}
