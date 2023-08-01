import { Point } from 'pixi.js';

export type Segment = [Point, Point];

export class MathUtils
{
    /**
   * Finds orientation of angle composed of 3 points
   * @param p first point
   * @param q second point
   * @param r third point
   * @returns 1 if clockwise, -1 if anti-clockwise, and 0 if flat
   */
    public static orientation(p : Point, q : Point, r : Point) : number
    {
        return -Math.sign(((q.y - p.y) * (r.x - q.x)) - ((q.x - p.x) * (r.y - q.y)));
    }

    public static isConvexPolygon(vertices : Point[])
    {
        let clockwise = 0;
        let antiClockwise = 0;
        let flat = 0;
        const length = vertices.length;

        for (let i = 0; i < length; i++)
        {
            const orientation = MathUtils.orientation(vertices[i], vertices[(i + 1) % length], vertices[(i + 2) % length]);

            if (orientation === 1) clockwise++;
            else if (orientation === -1) antiClockwise++;
            else flat++;
        }
        if (length - flat < 3)
        {
            throw new Error('Not a polygon, too many flat angles');
        }

        return ((clockwise !== 0) !== (antiClockwise !== 0));
    }
    static getRandom(min : number, max : number)
    {
        return (Math.random() * (max - min)) + min;
    }
}
