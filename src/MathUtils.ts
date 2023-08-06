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

    static closestPoint(to : Point, points : Point[])
    {
        let minDistance = Number.MAX_VALUE;
        let closest = new Point(0, 0);

        points.forEach((p) =>
        {
            const distance = p.subtract(to).magnitude();

            if (distance < minDistance)
            {
                closest = p;
                minDistance = distance;
            }
        });

        return closest;
    }

    static projectPolygon(vertices : Point[], normal : Point)
    {
        return vertices.map((v) => MathUtils.projectPoint(v, normal));
    }

    static projectPoint(point : Point, normal : Point)
    {
        const orientation = Math.sign(point.dot(normal));
        const length = point.project(normal).magnitude();

        return length * orientation;
    }

    static randomBool(weightTrue = 0.5)
    {
        return (Math.random() < weightTrue);
    }

    static clamp(number : number, min : number, max : number)
    {
        if (number < min) number = min;
        else if (number > max) number = max;

        return number;
    }

    static pointLineDistance(p0 : Point, [p1, p2] : Segment)
    {
        return Math.abs(((p2.x - p1.x) * (p1.y - p0.y)) - ((p1.x - p0.x) * (p2.y - p1.y)))
        / Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }

    static nearlyEqual(num1 : number, num2 : number, accuracy = 0.05)
    {
        return Math.abs(num2 - num1) < accuracy;
    }

    static nearlyEqualPoint(p1 : Point, p2 : Point, accuracy = 0.05)
    {
        return p2.subtract(p1).magnitude() < accuracy;
    }
}
