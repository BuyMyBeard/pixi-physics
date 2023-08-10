import { Circle, Point } from 'pixi.js';

/**
 * Line segment composed of 2 points
 */
export type Segment = [Point, Point];

/**
 * Various static methods to help with general math utilities
 */
export class MathUtils
{
    /**
   * Finds orientation of angle composed of 3 points
   * @param p First point
   * @param q Second point
   * @param r Third point
   * @returns 1 if clockwise, -1 if anti-clockwise, and 0 if flat
   */
    public static orientation(p : Point, q : Point, r : Point) : number
    {
        return -Math.sign(((q.y - p.y) * (r.x - q.x)) - ((q.x - p.x) * (r.y - q.y)));
    }

    /**
     * Check if polygon is convex
     * @param vertices Polygon vertices, needs at least 3 non-flat and non-zero angled vertices
     * @returns True if convex, false if concave
     */
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

    /**
     * Generate a pseudo-random floating-point number
     * @param min Minimum value
     * @param max Maximum value, excluded
     * @returns Random number between min included and max excluded
     */
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

    /**
     * Project polygon on a vector and returns all projected points as 1d vectors
     * @param vertices Polygon vertices to project
     * @param onto Vector to project polygon on
     * @returns Array containing all projected points
     */
    static projectPolygon(vertices : Point[], onto : Point)
    {
        return vertices.map((v) => MathUtils.projectPoint(v, onto));
    }

    /**
     * Project point on vector and return 1d vector
     * @param point point to project
     * @param onto Vector to project point onto
     * @returns 1 dimensional vector reprensenting projection of point on vector
     */
    static projectPoint(point : Point, onto : Point)
    {
        const orientation = Math.sign(point.dot(onto));
        const length = point.project(onto).magnitude();

        return length * orientation;
    }

    /**
     * Generate random boolean
     * @param weightTrue Chance to return true from 0 to 1. By default 0.5 (50% chance)
     * @returns true or false
     */
    static randomBool(weightTrue = 0.5)
    {
        return (Math.random() < weightTrue);
    }

    /**
     * Clamp value between a min and max range
     * @param number Number to clamp
     * @param min Minimum value
     * @param max Maximum value
     * @returns Clamped value
     */
    static clamp(number : number, min : number, max : number)
    {
        if (number < min) number = min;
        else if (number > max) number = max;

        return number;
    }

    // https://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
    /**
     * Distance between point p0 and segment p1p2
     * @param p0 Point to check distance with
     * @param p1p2 Line segment to check distance from
     * @returns distance between p0 and line segment p1p2
     */
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

    /**
     * Tells if num1 and num2 are nearly equal
     * @param num1 First number to check
     * @param num2 Second number to check
     * @param accuracy Specifies difference allowed to consider equal,
     * 0.05 is the value by default
     * @returns True if numbers are nearly equal, false otherwise
     */
    static nearlyEqual(num1 : number, num2 : number, accuracy = 0.05)
    {
        return Math.abs(num2 - num1) < accuracy;
    }

    /**
     * Tells if points p1 and p2 are nearly equal
     * @param p1 First point to check
     * @param p2 Second point to check
     * @param accuracy Specifies distance between 2 points allowed to consider equal,
     * 0.05 is the value by default
     * @returns True if points are nearly equal, false otherwise
     */
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

    /**
     * Tells if point is on line segment, and returns relative distance from line segment start
     * @param {Point} p0 Point to test on line segment
     * @param {Segment} p1p2 Line Segment
     * @returns 0 if at p1, 1 if at p2, linearly interpolated between, and false if p0 doesn't lie on p1p2
     */
    static pointOnLineSegment(p0 : Point, [p1, p2] : Segment) : number | false
    {
        const p1p2 = p2.subtract(p1);
        const p1p0 = p0.subtract(p1);

        if (p1p2.cross(p1p0) !== 0) return false;

        const kp1p2 = p1p2.dot(p1p2);
        const kp1p0 = p1p2.dot(p1p0);

        const ratio = kp1p0 / kp1p2;

        if (ratio >= 0 && ratio <= 1) return ratio;

        return false;
    }
    // taken from https://www.geeksforgeeks.org/check-if-two-given-line-segments-intersect/
    static segmentsIntersect(s1 : Segment, s2 : Segment)
    {
        const o1 = MathUtils.orientation(s1[0], s1[1], s2[0]);
        const o2 = MathUtils.orientation(s1[0], s1[1], s2[1]);
        const o3 = MathUtils.orientation(s2[0], s2[1], s1[0]);
        const o4 = MathUtils.orientation(s2[0], s2[1], s1[1]);

        return (o1 !== o2 && o3 !== o4);
    }
    // taken from https://www.jeffreythompson.org/collision-detection/line-line.php
    /** Honestly kinda fucking disgusting */
    static segmentsIntersect2(s1 : Segment, s2 : Segment)
    {
    // calculate the distance to intersection point
        const uA = (((s2[1].x - s2[0].x) * (s1[0].y - s2[0].y)) - ((s2[1].y - s2[0].y) * (s1[0].x - s2[0].x)))
        / (((s2[1].y - s2[0].y) * (s1[1].x - s1[0].x)) - ((s2[1].x - s2[0].x) * (s1[1].y - s1[0].y)));
        const uB = (((s1[1].x - s1[0].x) * (s1[0].y - s2[0].y)) - ((s1[1].y - s1[0].y) * (s1[0].x - s2[0].x)))
        / (((s2[1].y - s2[0].y) * (s1[1].x - s1[0].x)) - ((s2[1].x - s2[0].x) * (s1[1].y - s1[0].y)));

        // if uA and uB are between 0-1, lines are colliding
        return uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1;
    }
}
