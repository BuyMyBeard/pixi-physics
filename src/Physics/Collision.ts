import { Point } from 'pixi.js';
import { Body } from '../Body/Body';
import { CircleBody } from '../Body/CircleBody';
import { PolygonBody } from '../Body/PolygonBody';
import { MathUtils } from '../Utils/MathUtils';
import { Debug } from '../Utils/Debug';

/**
 * Instance of collision containing collision information
 */
export class Collision
{
    static collisionsInProgress : Collision[] = [];
    /**
     * Collision depth
     */
    depth : number;
    /**
    * Body 1 involved in collision
    */
    c1 : Body;
    /**
     * Body 2 involved in collision
     */
    c2 : Body;
    /**
     * Collision normal, pointing towards body 1
     */
    normal : Point;
    /**
     * Contact points of collision
     */
    contacts : Point[] = [];
    /**
     * Defines if collision is trigger only
     */
    isTrigger : boolean;

    /**
     *
     * @param c1 First body
     * @param c2 Second body
     * @param depth Depth of collision
     * @param normal Collision normal, pointing towards first body
     * @param isTrigger If false, collision will not apply physics to bodies. By default false.
     */
    public constructor(c1 : Body, c2 : Body, depth : number, normal : Point, isTrigger = false)
    {
        this.c1 = c1;
        this.c2 = c2;
        this.depth = depth;
        this.normal = normal;
        this.isTrigger = isTrigger;
    }

    /**
     * Get the other body involved in this collision
     * @param thisBody Current body in context
     * @returns Other body involved in this collision
     */
    public other(thisBody : Body)
    {
        if (this.c1 === thisBody) return this.c2;

        return this.c1;
    }

    public equals(collision : Collision)
    {
        return (this.c1 === collision.c1 && this.c2 === collision.c2)
        || (this.c1 === collision.c2 && this.c2 === collision.c1);
    }

    public containsColliders(c1 : Body, c2 : Body)
    {
        return (this.c1 === c1 && this.c2 === c2) || (this.c1 === c2 && this.c2 === c1);
    }

    public static collisionIndex(pair : [Body, Body]) : number
    {
        for (let i = 0; i < Collision.collisionsInProgress.length; i++)
        {
            if (Collision.collisionsInProgress[i].containsColliders(pair[0], pair[1]))
            {
                return i;
            }
        }

        return -1;
    }

    public static test(c1 : Body, c2 : Body, outCollision? : Collision) : Collision | false
    {
        if (c1.isStatic && c2.isStatic) return false;
        let collision : Collision | false = false;

        if (c1 instanceof CircleBody && c2 instanceof CircleBody)
        {
            collision = Collision.testCircleCircle(c1, c2);
        }
        else if (c1 instanceof PolygonBody && c2 instanceof PolygonBody)
        {
            collision = Collision.testPolyPoly(c1, c2);
        }
        else if (c1 instanceof PolygonBody && c2 instanceof CircleBody)
        {
            collision = Collision.testCirclePoly(c2, c1);
        }
        else if (c1 instanceof CircleBody && c2 instanceof PolygonBody)
        {
            collision = Collision.testCirclePoly(c1, c2);
        }

        if (outCollision !== undefined && collision) outCollision = collision;

        return collision;
    }

    private static testCircleCircle(cb1 : CircleBody, cb2 : CircleBody, outCollision? : Collision) : Collision | false
    {
        const vect = cb1.getGlobalPosition().subtract(cb2.getGlobalPosition());
        const distance = vect.magnitude();
        const depth = cb1.radius + cb2.radius - distance;
        const isTrigger = cb1.isTrigger || cb2.isTrigger;

        if (depth < 0) return false;

        const collision = new Collision(cb1, cb2, depth, vect.normalize(), isTrigger);

        if (outCollision !== undefined) outCollision = collision;

        return collision;
    }

    private static testPolyPoly(pb1 : PolygonBody, pb2 : PolygonBody, outCollision? : Collision) : Collision | false
    {
        let collisionDepth = Number.MAX_VALUE;
        let collisionNormal = new Point(0, 0);

        const edges = [...pb1.edges, ...pb2.edges];
        let normals = edges.map((edge) =>
        {
            const tangent = edge[1].subtract(edge[0]);

            return new Point(tangent.y, -tangent.x);
        });

        const normalsWithoutDuplicates : Point[] = [];

        // only efficient if not a lot of sides and likely to be 2 AABB,
        // benchmark to be sure because likely even less efficient this is O(n * n) while SAT is 0(n)
        if (normalsWithoutDuplicates.length === 8)
        {
            normals.forEach((n) =>
            {
                if (normalsWithoutDuplicates.every((o) => Math.abs(n.normalize().dot(o.normalize())) !== 1))
                {
                    normalsWithoutDuplicates.push(n);
                }
            });
            normals = normalsWithoutDuplicates;
        }

        for (const n of normals)
        {
            const projectedP1 = MathUtils.projectPolygon(pb1.vertices, n);
            const projectedP2 = MathUtils.projectPolygon(pb2.vertices, n);
            const minP1 = Math.min(...projectedP1);
            const maxP1 = Math.max(...projectedP1);
            const minP2 = Math.min(...projectedP2);
            const maxP2 = Math.max(...projectedP2);

            if (minP1 >= maxP2 || minP2 >= maxP1)
            {
                return false;
            }
            const currentDepth = Math.min(maxP2 - minP1, maxP1 - minP2);

            if (currentDepth < collisionDepth)
            {
                collisionDepth = currentDepth;
                collisionNormal = n;
            }
        }
        const centroid1 = pb1.centroid;
        const centroid2 = pb2.centroid;
        const normal = collisionNormal.normalize();
        const direction = Math.sign(normal.dot(centroid1.subtract(centroid2)));
        const isTrigger = pb1.isTrigger || pb2.isTrigger;

        const collision = new Collision(pb1, pb2, collisionDepth, normal.multiplyScalar(direction), isTrigger);

        if (outCollision !== undefined) outCollision = collision;

        return collision;
    }

    private static testCirclePoly(cb : CircleBody, pb : PolygonBody, outCollision? : Collision) : Collision | false
    {
        let collisionDepth = Number.MAX_VALUE;
        let collisionNormal = new Point(0, 0);

        const circlePos = cb.getGlobalPosition();
        const circleNormal = circlePos.subtract(MathUtils.closestPoint(circlePos, pb.vertices));

        let normals = pb.edges.map((edge) =>
        {
            const tangent = edge[1].subtract(edge[0]);

            return new Point(-tangent.y, tangent.x);
        });

        normals.push(circleNormal);

        const normalsWithoutDuplicates : Point[] = [];

        normals.forEach((n) =>
        {
            if (normalsWithoutDuplicates.every((o) => Math.abs(n.dot(o)) !== 1)) normalsWithoutDuplicates.push(n);
        });
        normals = normalsWithoutDuplicates;
        for (const n of normals)
        {
            const projectedPolygon = MathUtils.projectPolygon(pb.vertices, n);
            const projectedCircle = MathUtils.projectPoint(circlePos, n);
            const minP1 = Math.min(...projectedPolygon);
            const maxP1 = Math.max(...projectedPolygon);
            const minP2 = projectedCircle - cb.radius;
            const maxP2 = projectedCircle + cb.radius;

            if (minP1 >= maxP2 || minP2 >= maxP1)
            {
                return false;
            }
            const currentDepth = Math.min(maxP2 - minP1, maxP1 - minP2);

            if (currentDepth < collisionDepth)
            {
                collisionDepth = currentDepth;
                collisionNormal = n;
            }
        }
        const centroid1 = cb.centroid;
        const centroid2 = pb.centroid;
        const normal = collisionNormal.normalize();
        const direction = Math.sign(normal.dot(centroid1.subtract(centroid2)));
        const isTrigger = cb.isTrigger || pb.isTrigger;

        const collision = new Collision(cb, pb, collisionDepth, normal.multiplyScalar(direction), isTrigger);

        if (outCollision !== undefined) outCollision = collision;

        return collision;
    }

    public static findContacts(collision : Collision)
    {
        const c1 = collision.c1;
        const c2 = collision.c2;

        if (c1 instanceof PolygonBody && c2 instanceof PolygonBody)
        {
            Collision.findPolyPolyContacts(collision);
        }
        else if (c1 instanceof CircleBody || c2 instanceof CircleBody)
        {
            Collision.FindCircleContact(collision);
        }
    }

    private static FindCircleContact(collision : Collision)
    {
        let circle : CircleBody;
        let other : Body;

        if (collision.c1 instanceof CircleBody)
        {
            circle = collision.c1;
            other = collision.c2;
        }
        else
        {
            circle = collision.c2 as CircleBody;
            other = collision.c1;
        }
        const circleCenter = circle.centroid;
        const orientation = Math.sign((collision.normal.dot(other.centroid.subtract(circleCenter))));
        const contact = collision.normal.multiplyScalar(orientation * circle.radius).add(circleCenter);

        collision.contacts = [contact];

        Debug.drawPoint(contact.x, contact.y);
        const normalLineEnd = contact.add(collision.normal.multiplyScalar(10));

        Debug.drawLine(contact.x, contact.y, normalLineEnd.x, normalLineEnd.y);
    }

    private static findPolyPolyContacts(collision : Collision)
    {
        const p1 = collision.c1 as PolygonBody;
        const p2 = collision.c2 as PolygonBody;

        let minDistance = Number.MAX_VALUE;
        let contact1 = new Point(0, 0);
        let contact2 : Point | false = false;

        p1.vertices.forEach((v) =>
        {
            p2.edges.forEach((s) =>
            {
                const distance = MathUtils.pointLineDistance(v, s);

                if (MathUtils.nearlyEqual(distance, minDistance, 0.1))
                {
                    if (!MathUtils.nearlyEqualPoint(v, contact1, 0.1)) contact2 = v;
                }
                else if (distance < minDistance)
                {
                    minDistance = distance;
                    contact1 = v;
                }
            });
        });
        p2.vertices.forEach((v) =>
        {
            p1.edges.forEach((s) =>
            {
                const distance = MathUtils.pointLineDistance(v, s);

                if (MathUtils.nearlyEqual(distance, minDistance))
                {
                    if (!MathUtils.nearlyEqualPoint(v, contact1)) contact2 = v;
                }
                else if (distance < minDistance)
                {
                    minDistance = distance;
                    contact1 = v;
                }
            });
        });

        if (contact2) collision.contacts = [contact1, contact2];
        else collision.contacts = [contact1];

        collision.contacts.forEach((c) =>
        {
            Debug.drawPoint(c.x, c.y);

            const normalLineEnd = c.add(collision.normal.multiplyScalar(10));

            Debug.drawLine(c.x, c.y, normalLineEnd.x, normalLineEnd.y);
        });
    }
}
