import { Point } from 'pixi.js';
import { Body } from './Body';
import { CircleBody } from './CircleBody';
import { PolygonBody } from './PolygonBody';
import { MathUtils } from './MathUtils';

export class Collision
{
    static collisionsInProgress : Collision[] = [];
    depth : number;
    c1 : Body;
    c2 : Body;
    normal : Point;

    public constructor(c1 : Body, c2 : Body, depth : number, normal : Point)
    {
        this.c1 = c1;
        this.c2 = c2;
        this.depth = depth;
        this.normal = normal;
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

        if (depth < 0) return false;

        const collision = new Collision(cb1, cb2, depth, vect.normalize());

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

            return new Point(-tangent.y, tangent.x);
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
        const collision = new Collision(pb1, pb2, collisionDepth, collisionNormal.normalize());

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
        const collision = new Collision(cb, pb, collisionDepth, collisionNormal.normalize());

        if (outCollision !== undefined) outCollision = collision;

        return collision;
    }
}
