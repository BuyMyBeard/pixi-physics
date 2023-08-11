import { BinaryTree, Node } from '../Utils/BinaryTree';
import { BroadPhase } from './BroadPhase';
import { Body } from '../Body/Body';

/**
 * Splits x and y axis by the median body recursively until maxDepth is reached or only 1 body is in partition,
 * and returns all unique pairs of bodies in the same partition
 * */
export class KDTree extends BinaryTree<Body> implements BroadPhase
{
    private listOfPairs : Array<[Body, Body]> = [];
    private currentDepth = 1;

    constructor(maxDepth = 10)
    {
        super();
        this.maxDepth = maxDepth;
    }

    public override compare: (x: Body, y: Body) => number
        = (body1, body2) =>
        {
            let comparisonBody1;
            let comparisonBody2;

            if (this.currentDepth % 2 === 1)
            {
                comparisonBody1 = body1.boundingBox.x;
                comparisonBody2 = body2.boundingBox.x;
            }
            else
            {
                comparisonBody1 = body1.boundingBox.y;
                comparisonBody2 = body2.boundingBox.y;
            }
            if (comparisonBody1 > comparisonBody2) return 1;
            else if (comparisonBody1 === comparisonBody2) return 0;

            return -1;
        };
    apply(colliders: Body[]): [Body, Body][]
    {
        this.processData([...colliders]);

        return this.listOfPairs;
    }
    private processData(data : Body[], node = this.root, depth = 1)
    {
        if (this.baseCase(depth, data))
        {
            this.checkDataForPairs(data);

            return;
        }
        this.currentDepth = depth;
        /** sorting the list so often seems like a terrible waste, but I couldn't find another way */
        data.sort(this.compare);

        const medianIndex = Math.floor(data.length / 2);
        let separator : number;
        let val : any;
        const leftData : Body[] = [];
        let rightData : Body[];

        // alternating axis depending on depth
        if (depth % 2 === 1)
        {
            if (data.length % 2 === 1) separator = data[medianIndex].boundingBox.x;
            else separator = (data[medianIndex].boundingBox.x - data[medianIndex - 1].boundingBox.x) / 2;

            rightData = data.splice(medianIndex);

            while ((val = data.pop()) !== undefined)
            {
                leftData.push(val);
                if (val.boundingBox.right >= separator) rightData.push(val);
            }
        }
        else
        {
            if (data.length % 2 === 1) separator = data[medianIndex].boundingBox.y;
            else separator = (data[medianIndex].boundingBox.y - data[medianIndex - 1].boundingBox.y) / 2;

            rightData = data.splice(medianIndex);

            while ((val = data.pop()) !== undefined)
            {
                leftData.push(val);
                if (val.boundingBox.bottom >= separator) rightData.push(val);
            }
        }

        if (data.length > 0)
        {
            node.left = new Node<Body>();
            this.processData(leftData, node.left, depth + 1);
        }

        if (rightData.length > 0)
        {
            node.right = new Node<Body>();
            this.processData(rightData, node.right, depth + 1);
        }
    }

    private checkDataForPairs(data : Body[])
    {
        if (data.length < 2) return;

        for (let i = 0; i < data.length; i++)
        {
            for (let j = i + 1; j < data.length; j++)
            {
                this.addPairWithoutDuplication(data[i], data[j]);
            }
        }
    }

    private addPairWithoutDuplication(body1 : Body, body2 : Body)
    {
        if (this.listOfPairs.findIndex(([body3, body4]) =>
            (body3 === body1 && body4 === body2) || (body3 === body2 && body4 === body1))
            === -1)
        {
            this.listOfPairs.push([body1, body2]);
        }
    }
}
