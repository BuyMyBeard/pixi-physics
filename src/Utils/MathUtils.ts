import { Circle, Point } from 'pixi.js';

/** Line segment composed of 2 points */
export type Segment = [Point, Point];
/** Triangle conposed of 3 points */
export type Triangle = [Point, Point, Point];
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
    /** Honestly kinda fucking disgusting to look at */
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

    public static triangleArea([p1, p2, p3] : Triangle)
    {
        // calculated with Heron's formula
        const a = p2.subtract(p1).magnitude();
        const b = p3.subtract(p2).magnitude();
        const c = p1.subtract(p3).magnitude();

        const s = (a + b + c) / 2;

        return Math.sqrt(s * (s - a) * (s - b) * (s - c));
    }

    public static pointInsideTriangle(p0 : Point, [p1, p2, p3] : Triangle)
    {
        const p1p2p3Area = this.triangleArea([p1, p2, p3]);
        const p0p1p2Area = this.triangleArea([p0, p1, p2]);
        const p0p2p3Area = this.triangleArea([p0, p2, p3]);
        const p0p3p1Area = this.triangleArea([p0, p3, p1]);

        // to account for floating point precision
        return (p1p2p3Area.toPrecision(6) === (p0p1p2Area + p0p2p3Area + p0p3p1Area).toPrecision(6));
    }
    public static triangulatePolygon(vertices : Point[]) : Triangle[]
    {
        const v = [...vertices];
        const triangles : Triangle[] = [];
        // Uses Ear-clipping algorithm
        const polyInfo = this.getPolygonInfo(vertices);
        let i = 0;

        while (++i)
        {
            if (i > vertices.length) throw new Error('Max iterations reached');
            if (v.length === 3)
            {
                triangles.push([v[0], v[1], v[2]]);

                return triangles;
            }
            const sideCount = v.length;

            for (let i = 0; i < sideCount; i++)
            {
                const p1 = v[(i - 1 + sideCount) % sideCount];
                const p2 = v[(i) % sideCount];
                const p3 = v[(i + 1) % sideCount];
                const clockwise = this.orientation(p1, p2, p3) === 1;

                if (clockwise !== polyInfo.isClockwise) continue;

                const start = (i + 2) % sideCount;
                const end = (i - 2 + sideCount) % sideCount;
                let isEar = true;

                for (let j = start; j !== end; j = (j + 1) % sideCount)
                {
                    if (this.pointInsideTriangle(v[j], [p1, p2, p3]))
                    {
                        isEar = false;
                        break;
                    }
                }

                if (isEar)
                {
                    triangles.push([p1, p2, p3]);
                    v.splice(i, 1);
                    break;
                }
            }
        }

        return [];
    }

    public static getPolygonInfo(vertices : Point[]) : PolygonInfo
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
        const isConvex = ((clockwise !== 0) !== (antiClockwise !== 0));
        const isClockwise = clockwise > antiClockwise;

        return {
            isConvex,
            isClockwise
        };
    }
    public static generatePolygon()
    {
        // code from https://observablehq.com/@tarte0/generate-random-convex-polygon#generateCoordinates
        const generateCoordinates = (n : number) =>
        {
            // Generate two lists of random X and Y coordinates
            const xPool = [];
            const yPool = [];

            for (let i = 0; i < n; i++)
            {
                xPool.push(Math.random());
                yPool.push(Math.random());
            }

            // Sort them
            xPool.sort();
            yPool.sort();

            // Isolate the extreme points
            const minX = xPool[0];
            const maxX = xPool[n - 1];
            const minY = yPool[0];
            const maxY = yPool[n - 1];

            return { xPool, yPool, minX, maxX, minY, maxY };
        };
        const shuffle = (a : any) =>
        {
            for (let i = a.length - 1; i > 0; i--)
            {
                const j = Math.floor(Math.random() * (i + 1));

                [a[i], a[j]] = [a[j], a[i]];
            }

            return a;
        };

        const generateVectors = (coord : any) =>
        {
            // Divide the interior points of the coordinates into two chains & extract the vector components
            const xVec = [];
            const yVec = [];
            const n = coord.xPool.length;

            let lastTop = coord.minX; let
                lastBot = coord.minX;

            for (let i = 1; i < n - 1; i++)
            {
                const x = coord.xPool[i];

                if (Math.random() < 0.5)
                {
                    xVec.push(x - lastTop);
                    lastTop = x;
                }
                else
                {
                    xVec.push(lastBot - x);
                    lastBot = x;
                }
            }

            xVec.push(coord.maxX - lastTop);
            xVec.push(lastBot - coord.maxX);

            let lastLeft = coord.minY; let
                lastRight = coord.minY;

            for (let i = 1; i < n - 1; i++)
            {
                const y = coord.yPool[i];

                if (Math.random() < 0.5)
                {
                    yVec.push(y - lastLeft);
                    lastLeft = y;
                }
                else
                {
                    yVec.push(lastRight - y);
                    lastRight = y;
                }
            }

            yVec.push(coord.maxY - lastLeft);
            yVec.push(lastRight - coord.maxY);

            // Randomly pair up the X- and Y-components
            shuffle(yVec);

            // Combine the paired up components into vectors
            const vec = [];

            for (let i = 0; i < n; i++)
            {
                vec.push([xVec[i], yVec[i]]);
            }

            return vec;
        };

        const generatePolygon = (n : number, width : number, height : number) =>
        {
            const coord = generateCoordinates(n);
            const vec = generateVectors(coord);

            // Sort the vectors by angle
            vec.sort((u, v) => Math.atan2(u[1], u[0]) - Math.atan2(v[1], v[0]));

            // Lay them end-to-end
            let x = 0; let
                y = 0;
            let minPolygonX = 0;
            let minPolygonY = 0;
            const points = [];

            for (let i = 0; i < n; i++)
            {
                points.push([x, y]);

                x += vec[i][0];
                y += vec[i][1];

                minPolygonX = Math.min(minPolygonX, x);
                minPolygonY = Math.min(minPolygonY, y);
            }

            // Move the polygon to the original min and max coordinates
            const xShift = coord.minX - minPolygonX;
            const yShift = coord.minY - minPolygonY;

            for (let i = 0; i < n; i++)
            {
                const p : any = points[i];

                points[i] = [(p[0] + xShift) * width, (p[1] + yShift) * height];
            }

            return points;
        };

        const pointArray = generatePolygon(Math.floor((Math.random() * 8) + 3), 100, 100);

        const convertedPointArray = pointArray.map((point : any) => new Point(point[0], point[1]));

        const verticesSum = new Point(0, 0);

        convertedPointArray.forEach((v) => verticesSum.set(verticesSum.x + v.x, verticesSum.y + v.y));

        const centroid = verticesSum.multiplyScalar(1 / convertedPointArray.length);

        return convertedPointArray.map((point) => point.subtract(centroid));
    }
}

export type PolygonInfo = {
    isConvex: boolean,
    isClockwise: boolean,
};
