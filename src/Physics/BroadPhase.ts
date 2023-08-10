import { FillStyle, Point } from 'pixi.js';
import { Body } from '../Body/Body';

/** Dependency injection setup for implementing different types of Broad phase algorithms */
export interface BroadPhase
{
    apply(colliders : Body[]) : [Body, Body][];
}
/**
 * Sorts all colliders, and then checks for overlap of bounding box on X axis to reduce amount of collider pairs to check
 */
// TODO: could check density of bodies and sweep on Y axis instead if more optimal
export class SweepAndPrune implements BroadPhase
{
    apply(colliders : Array<Body>) : Array<[Body, Body]>
    {
        const active : Set<Body> = new Set();
        const listOfPairs : Array<[Body, Body]> = [];

        colliders.sort((c1, c2) => c1.boundingBox.x - c2.boundingBox.x);
        for (const c of colliders)
        {
            if (active.size === 0)
            {
                active.add(c);
                continue;
            }

            const minBoundary = c.boundingBox.x;
            const maxBoundary = c.boundingBox.x + c.boundingBox.width;

            for (const a of active)
            {
                const minBoundary2 = a.boundingBox.x;
                const maxBoundary2 = a.boundingBox.x + a.boundingBox.width;

                if (maxBoundary2 < minBoundary || maxBoundary < minBoundary2)
                {
                    active.delete(a);
                }
                else
                {
                    listOfPairs.push([c, a]);
                }
            }
            active.add(c);
        }

        return listOfPairs;
    }
}

export class GridPartition implements BroadPhase
{
    gridCorner : Point;
    dimensions : Point;
    cellCount : Point;

    private grid : Body[][][] = [];
    private listOfPairs : Array<[Body, Body]> = [];
    private cellDimension = new Point(0, 0);


    constructor(gridCorner = new Point(0, 0), dimensions = new Point(window.innerWidth, window.innerHeight),
        cellCount = new Point(50, 50))
    {
        this.gridCorner = gridCorner;
        this.dimensions = dimensions;
        this.cellCount = cellCount;
    }

    apply(colliders: Body[]): [Body, Body][]
    {
        this.listOfPairs = [];
        this.cellDimension = new Point(this.dimensions.x / this.cellCount.x, this.dimensions.y / this.cellCount.y);
        this.grid = [];

        for (let j = 0; j < this.cellCount.y; j++)
        {
            this.grid[j] = [];
            for (let i = 0; i < this.cellCount.x; i++)
            {
                this.grid[j][i] = [];
            }
        }

        colliders.forEach((collider) =>
        {
            const aabb = collider.boundingBox;
            const startingCell = new Point(Math.floor(aabb.x / this.cellDimension.x),
                Math.floor(aabb.y / this.cellDimension.y));
            const endingCell = new Point(Math.floor(aabb.right / this.cellDimension.x),
                Math.floor(aabb.bottom / this.cellDimension.y));

            this.fillCells(collider, startingCell, endingCell);
        });

        for (let j = 0; j < this.cellCount.y; j++)
        {
            for (let i = 0; i < this.cellCount.x; i++)
            {
                this.checkCellForPairs(i, j);
            }
        }

        return this.listOfPairs;
    }

    private fillCells(body : Body, startCell : Point, endCell : Point)
    {
        if (startCell.equals(endCell))
        {
            this.grid[startCell.y][startCell.x].push(body);
            return;
        }
        const spaceFilled = endCell.subtract(startCell);

        for (let j = startCell.y; j <= spaceFilled.y; j++)
        {
            for (let i = startCell.x; i <= spaceFilled.x; i++)
            {
                this.grid[j][i].push(body);
            }
        }
    }

    private checkCellForPairs(column : number, row : number)
    {
        const content = this.grid[row][column];

        if (content.length < 2) return;

        for (let i = 0; i < content.length; i++)
        {
            for (let j = i + 1; j < content.length; j++)
            {
                this.addPairWithoutDuplication(content[i], content[j]);
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
