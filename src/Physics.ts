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
    static update()
    {
        const listOfPairs = sweepAndPrune(Body.bodyPool);
        const newCollisions : Collision[] = [];

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
                this.respondToCollision(pair[0], pair[1]);
                Physics.resolveCollision(collision);
                newCollisions.push(collision);
            }
            else if (collision && index !== -1)
            {
                Collision.collisionsInProgress[index] = collision;
                if (pair[0].onCollisionStay !== undefined) pair[0].onCollisionStay(collision);
                if (pair[1].onCollisionStay !== undefined) pair[1].onCollisionStay(collision);
                Physics.resolveCollision(collision);
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
    }

    private static respondToCollision(c1 : Body, c2 : Body)
    {
        if (c1 instanceof CircleBody && c2 instanceof CircleBody)
        {
            Physics.circleCircleResponse(c1, c2);
        }
        else if (c1 instanceof PolygonBody && c2 instanceof PolygonBody)
        {
            // TODO:
        }
        else if (c1 instanceof PolygonBody && c2 instanceof CircleBody)
        {
            // TODO:
        }
        else if (c1 instanceof CircleBody && c2 instanceof PolygonBody)
        {
            // TODO:
        }
    }

    private static resolveCollision(collision : Collision)
    {
        collision.c1.queueResolution(collision.normal.multiplyScalar(collision.depth * 0.5));
        collision.c2.queueResolution(collision.normal.multiplyScalar(-collision.depth * 0.5));
        // if (collision.c1 instanceof CircleBody && collision.c2 instanceof CircleBody)
        // {
        //     // TODO: actually resolve collision instead of pushing away bodies
        //     Physics.resolveCircleCircle(collision);
        // }
        // else if (collision.c1 instanceof PolygonBody && collision.c2 instanceof PolygonBody)
        // {
        //     // TODO:
        // }
        // else if (collision.c1 instanceof PolygonBody && collision.c2 instanceof CircleBody)
        // {
        //     // TODO:
        // }
        // else if (collision.c1 instanceof CircleBody && collision.c2 instanceof PolygonBody)
        // {
        //     // TODO:
        // }
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

        if (cb1.bodyType === 'Dynamic' && cb2.bodyType === 'Dynamic')
        {
            const v1nFinal = ((v1n * (cb1.mass - cb2.mass)) + (2 * cb2.mass * v2n)) / (cb1.mass + cb2.mass);
            const v2nFinal = ((v2n * (cb2.mass - cb1.mass)) + (2 * cb1.mass * v1n)) / (cb1.mass + cb2.mass);

            const v1nFinalVect = unitNormal.multiplyScalar(v1nFinal * resultingBounciness);
            const v2nFinalVect = unitNormal.multiplyScalar(v2nFinal * resultingBounciness);
            const v1tFinalVect = unitTangent.multiplyScalar(v1t - (v1t * resultingFriction));
            const v2tFinalVect = unitTangent.multiplyScalar(v2t - (v2t * resultingFriction));

            cb1.queueResponse(v1nFinalVect.add(v1tFinalVect));
            cb2.queueResponse(v2nFinalVect.add(v2tFinalVect));
        }
        else if (cb1.bodyType === 'Dynamic' || cb2.bodyType === 'Dynamic')
        {
            let rb : Body;
            let vn : number;
            let vt : number;

            if (cb1.bodyType === 'Dynamic')
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

    private static resolveCircleCircle(collision : Collision)
    {
        // const massRatio = collision.c1.mass / collision.c2.mass;
        collision.c1.queueResolution(collision.normal.multiplyScalar(-collision.depth));
        collision.c2.queueResolution(collision.normal.multiplyScalar(collision.depth));
    }
}
