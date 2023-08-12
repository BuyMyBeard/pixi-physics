export class Node<T>
{
    left? : Node<T>;
    right? : Node<T>;
    data : Array<T>;
    depth : number;

    constructor(depth : number, data : Array<T> = [])
    {
        this.data = data;
        this.depth = depth;
    }
}

export class BinaryTree<T>
{
    public maxDepth = 100;
    public root = new Node<T>(1);
    private stack : Node<T>[] = [];
    /**
     * Comparator for type provided. Does basic < > === comparison on x and y,
     * but can be overwriten by setting a different callback that returns 1, 0 and -1
     * @param x First item to compare
     * @param y Second item to compare
     * @returns 1 If x > y, -1 if x < y, 0 if x === y
     */
    public compare : (x : T, y : T) => number = (x, y) =>
    {
        if (x === y) return 0;
        if (x > y) return 1;

        return -1;
    };

    public fillRecursively : (data : Array<T>, node : Node<T>, depth : number) => void
        = (data, node = this.root, depth = 0) =>
        {
            if (this.baseCase(depth, data))
            {
                node.data = data;

                return;
            }
            const leftData = [];
            const rightData = [];
            const pivotIndex = Math.floor(data.length / 2);
            const pivot = data[pivotIndex];

            node.data = data.splice(pivotIndex, 1);

            let val;

            while ((val = data.pop()) !== undefined)
            {
                const comparison = this.compare(val, pivot);

                if (comparison < 0) leftData.push(val);
                else if (comparison === 0) node.data.push(val);
                else rightData.push(val);
            }
            if (leftData.length > 0)
            {
                node.left = new Node<T>(depth + 1);
                this.fillRecursively(leftData, node.left, depth + 1);
            }

            if (rightData.length > 0)
            {
                node.right = new Node<T>(depth + 1);
                this.fillRecursively(rightData, node.right, depth + 1);
            }
        };

    fillIteratively : (data : Array<T>) => void = (data) =>
    {
        let current : Node<T> | undefined = this.root;
        let depth;
        const stack = [current];

        current.data = data;

        while ((current = stack.pop()) !== undefined)
        {
            depth = current.depth;

            if (this.baseCase(depth, data))
            {
                current.data = data;
                stack.pop();
                continue;
            }
            const leftData = [];
            const rightData = [];
            const pivotIndex = Math.floor(current.data.length / 2);
            const pivot = current.data[pivotIndex];

            current.data = current.data.splice(pivotIndex, 1);

            let val;

            while ((val = data.pop()) !== undefined)
            {
                const comparison = this.compare(val, pivot);

                if (comparison < 0) leftData.push(val);
                else if (comparison === 0) current.data.push(val);
                else rightData.push(val);
            }
            if (rightData.length > 0)
            {
                current.right = new Node<T>(depth + 1);
                current.right.data = rightData;
                stack.push(current.right);
            }
            if (leftData.length > 0)
            {
                current.left = new Node<T>(depth + 1);
                current.left.data = leftData;
                stack.push(current.left);
            }
        }
    }
    public baseCase : (depth : number, data : Array<T>) => boolean = (depth, data) =>
        depth >= this.maxDepth || data.length <= 1;
}
