import { Circle, Point } from 'pixi.js';

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

    // https://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
    static pointLineDistance(p0 : Point, [p1, p2] : Segment)
    {
        const A = p0.x - p1.x;
        const B = p0.y - p1.y;
        const C = p2.x - p1.x;
        const D = p2.y - p1.y;

        const dot = (A * C) + (B * D);
        const lenSq = (C * C) + (D * D);
        let param = -1;

        if (lenSq !== 0) // in case of 0 length line
        { param = dot / lenSq; }

        let xx : number;
        let yy : number;

        if (param < 0)
        {
            xx = p1.x;
            yy = p1.y;
        }
        else if (param > 1)
        {
            xx = p2.x;
            yy = p2.y;
        }
        else
        {
            xx = p1.x + (param * C);
            yy = p1.y + (param * D);
        }

        const dx = p0.x - xx;
        const dy = p0.y - yy;

        return Math.sqrt((dx * dx) + (dy * dy));
    }

    static nearlyEqual(num1 : number, num2 : number, accuracy = 0.05)
    {
        return Math.abs(num2 - num1) < accuracy;
    }

    static nearlyEqualPoint(p1 : Point, p2 : Point, accuracy = 0.05)
    {
        return p2.subtract(p1).magnitude() < accuracy;
    }

    static lineSegmentCircleIntersection([p0, p1] : Segment, circle : Circle) : [Point, Point] | Point | false
    {
        if (p1.x === p0.x)
        {
            const A = 1;
            const B = -2 * circle.y;
            const C = ((p0.x * p0.x) - (2 * circle.x * p0.x) + (circle.x * circle.x)
                + (circle.y + circle.y) - (circle.radius * circle.radius));

            const discriminant = (B * B) - (4 * A * C);

            if (discriminant < 0) return false;
            if (discriminant === 0)
            {
                const y = -B / (2 * A);

                return new Point(p0.x, y);
            }
            const y1 = (-B + Math.sqrt(discriminant)) / (2 * A);
            const y2 = (-B - Math.sqrt(discriminant)) / (2 * A);

            return [new Point(p0.x, y1), new Point(p0.x, y2)];
        }

        const m = (p1.y - p0.y) / (p1.x - p0.x);
        const b = p0.y - (m * p0.x);

        const A = 1 + (m * m);
        const B = (2 * m * (b - circle.y)) - (2 * circle.x);
        const C = ((circle.x * circle.x) + (b * b)) - (2 * b * circle.y) + circle.y - (circle.radius * circle.radius);

        const discriminant = (B * B) - (4 * A * C);

        if (discriminant < 0) return false;
        if (discriminant === 0)
        {
            const x = -B / (2 * A);
            const y = (m * x) + b;

            return new Point(x, y);
        }
        const x1 = (-B + Math.sqrt(discriminant)) / (2 * A);
        const x2 = (-B - Math.sqrt(discriminant)) / (2 * A);

        const y1 = (m * x1) + b;
        const y2 = (m * x2) + b;

        return [new Point(x1, y1), new Point(x2, y2)];
    }

    // static lineSegmentsIntersection([p0, p1] : Segment, [p2, p3] : Segment) : Point | false
    // {

    // }

    static pointInsideCircle(point : Point, circle : Circle)
    {
        return point.subtract(new Point(circle.x, circle.y)).magnitude() <= circle.radius;
    }
}
