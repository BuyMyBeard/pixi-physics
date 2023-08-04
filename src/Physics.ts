import { Point } from 'pixi.js';
import { Body } from './Body';
import { CircleBody } from './CircleBody';
import { Collision } from './Collision';
import { sweepAndPrune } from './SAP';
import { PolygonBody } from './PolygonBody';

/**
 * Static class that manages collisions every frame between bodies
 */
export class Physics
{
    static checkForCollisions()
    {
        const listOfPairs = sweepAndPrune(Body.bodyPool);
        const newCollisions : Collision[] = [];
        let queuedResolutions : [Body, Point][] = [];

        // console.log("unoptimized", this.bodyPool.length * this.bodyPool.length);
        // console.log("reduced", listOfPairs.length);
        listOfPairs.forEach((pair) =>
        {
            // this.getPairArray().forEach((pair) => {
            const index = Collision.collisionIndex(pair);
            const collision = Collision.test(pair[0], pair[1]);

            if (index === -1 && collision)
            {
                if (pair[0].onCollisionEnter !== undefined) pair[0].onCollisionEnter(collision);
                if (pair[1].onCollisionEnter !== undefined) pair[1].onCollisionEnter(collision);
                Physics.respondToCollision(collision);
                queuedResolutions = [...queuedResolutions, ...Physics.resolveCollision(collision)];
                newCollisions.push(collision);
            }
            else if (collision && index !== -1)
            {
                Collision.collisionsInProgress[index] = collision;
                if (pair[0].onCollisionStay !== undefined) pair[0].onCollisionStay(collision);
                if (pair[1].onCollisionStay !== undefined) pair[1].onCollisionStay(collision);
                queuedResolutions = [...queuedResolutions, ...Physics.resolveCollision(collision)];
                Collision.collisionsInProgress.splice(index, 1);
                newCollisions.push(collision);
            }
        });

        Collision.collisionsInProgress.forEach((collision) =>
        {
            if (collision.c1.onCollisionExit !== undefined) collision.c1.onCollisionExit(collision);
            if (collision.c2.onCollisionExit !== undefined) collision.c2.onCollisionExit(collision);
        });

        Collision.collisionsInProgress = newCollisions;

        queuedResolutions.forEach(([body, resolution]) =>
        {
            body.x += resolution.x;
            body.y += resolution.y;
        });
    }

    private static respondToCollision(collision : Collision)
    {
        const unitTangent = new Point(-collision.normal.y, collision.normal.x);
        const resultingBounciness = (collision.c1.bounciness + collision.c2.bounciness) / 2;
        const resultingFriction = (collision.c1.friction + collision.c2.friction) / 2;

        const v1n = collision.normal.dot(collision.c1.velocity);
        const v1t = unitTangent.dot(collision.c1.velocity);
        const v2n = collision.normal.dot(collision.c2.velocity);
        const v2t = unitTangent.dot(collision.c2.velocity);

        if (!collision.c1.isStatic && !collision.c2.isStatic)
        {
            const v1nFinal = ((v1n * (collision.c1.mass - collision.c2.mass))
            + (2 * collision.c2.mass * v2n)) / (collision.c1.mass + collision.c2.mass);
            const v2nFinal = ((v2n * (collision.c2.mass - collision.c1.mass))
            + (2 * collision.c1.mass * v1n)) / (collision.c1.mass + collision.c2.mass);

            const v1nFinalVect = collision.normal.multiplyScalar(v1nFinal * resultingBounciness);
            const v2nFinalVect = collision.normal.multiplyScalar(v2nFinal * resultingBounciness);
            const v1tFinalVect = unitTangent.multiplyScalar(v1t - (v1t * resultingFriction));
            const v2tFinalVect = unitTangent.multiplyScalar(v2t - (v2t * resultingFriction));

            collision.c1.addForce(v1nFinalVect.add(v1tFinalVect));
            collision.c2.addForce(v2nFinalVect.add(v2tFinalVect));
        }
        else
        {
            let rb : Body;
            let vn : number;
            let vt : number;

            if (collision.c2.isStatic)
            {
                rb = collision.c1;
                vn = v1n;
                vt = v1t;
            }
            else
            {
                rb = collision.c2;
                vn = v2n;
                vt = v2t;
            }
            const vnFinalVect = collision.normal.multiplyScalar(vn * -1 * resultingBounciness);
            const vtFinalVect = unitTangent.multiplyScalar(vt - (vt * resultingFriction));

            rb.addForce(vnFinalVect.add(vtFinalVect));
        }
    }

    private static resolveCollision(collision : Collision) : [Body, Point][]
    {
        const extra = 0.1;
        const centroid1 = collision.c1.centroid;
        const centroid2 = collision.c2.centroid;
        const direction = Math.sign(collision.normal.dot(centroid2.subtract(centroid1)));
        const moveDistance = collision.depth + extra;

        if (collision.c1.isStatic)
        {
            return [[collision.c2, collision.normal.multiplyScalar(moveDistance * direction)]];
        }
        else if (collision.c2.isStatic)
        {
            return [[collision.c1, collision.normal.multiplyScalar(-moveDistance * direction)]];
        }

        return [[collision.c1, collision.normal.multiplyScalar(-moveDistance * direction)],
            [collision.c2, collision.normal.multiplyScalar(moveDistance * direction)]];
    }

    private static circleCircleResponse(cb1: CircleBody, cb2 : CircleBody)
    {
        const c1Pos = cb1.getGlobalPosition();
        const c2Pos = cb2.getGlobalPosition();
        const unitNormal = c2Pos.subtract(c1Pos).normalize();
        const unitTangent = new Point(-unitNormal.y, unitNormal.x);
        const resultingBounciness = (cb1.bounciness + cb2.bounciness) / 2;
        const resultingFriction = (cb1.friction + cb2.friction) / 2;

        const v1n = unitNormal.dot(cb1.velocity);
        const v1t = unitTangent.dot(cb1.velocity);
        const v2n = unitNormal.dot(cb2.velocity);
        const v2t = unitTangent.dot(cb2.velocity);

        if (!cb1.isStatic && !cb2.isStatic)
        {
            const v1nFinal = ((v1n * (cb1.mass - cb2.mass)) + (2 * cb2.mass * v2n)) / (cb1.mass + cb2.mass);
            const v2nFinal = ((v2n * (cb2.mass - cb1.mass)) + (2 * cb1.mass * v1n)) / (cb1.mass + cb2.mass);

            const v1nFinalVect = unitNormal.multiplyScalar(v1nFinal * resultingBounciness);
            const v2nFinalVect = unitNormal.multiplyScalar(v2nFinal * resultingBounciness);
            const v1tFinalVect = unitTangent.multiplyScalar(v1t - (v1t * resultingFriction));
            const v2tFinalVect = unitTangent.multiplyScalar(v2t - (v2t * resultingFriction));

            cb1.addForce(v1nFinalVect.add(v1tFinalVect));
            cb2.addForce(v2nFinalVect.add(v2tFinalVect));
        }
        else
        {
            let rb : Body;
            let vn : number;
            let vt : number;

            if (cb2.isStatic)
            {
                rb = cb1;
                vn = v1n;
                vt = v1t;
            }
            else
            {
                rb = cb2;
                vn = v2n;
                vt = v2t;
            }
            const vnFinalVect = unitNormal.multiplyScalar(vn * -1 * resultingBounciness);
            const vtFinalVect = unitTangent.multiplyScalar(vt - (vt * resultingFriction));

            rb.queueResponse(vnFinalVect.add(vtFinalVect));
        }
    }

    public static step(deltaTime : number, substeps = 1)
    {
        for (let i = 0; i < substeps; i++)
        {
            Physics.applyMovementToBodies(deltaTime / substeps);
            Physics.checkForCollisions();
        }
        Body.bodyPool.forEach((body) => body.resetInpulse());
    }

    private static applyMovementToBodies(deltaTime : number)
    {
        for (const b of Body.bodyPool)
        {
            if (b.isStatic) continue;
            b.velocity = b.velocity.add(b.force.multiplyScalar(deltaTime));
            b.x += b.velocity.x * deltaTime;
            b.y += b.velocity.y * deltaTime;
            b.updateBoundingBox();
        }
    }
}
