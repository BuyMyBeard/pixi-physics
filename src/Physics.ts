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
                Collision.collisionsInProgress.push(new Collision(pair[0], pair[1], 0));
            }
            else if (collision && index !== -1)
            {
                Collision.collisionsInProgress[index] = collision;
                if (pair[0].onCollisionStay !== undefined) pair[0].onCollisionStay(collision);
                if (pair[1].onCollisionStay !== undefined) pair[1].onCollisionStay(collision);
                Physics.resolveCollision(pair[0], pair[1]);
            }
            else if (index !== -1 && !collision)
            {
                const previousCollision = Collision.collisionsInProgress.splice(index, 1)[0];

                if (pair[0].onCollisionExit !== undefined) pair[0].onCollisionExit(previousCollision);
                if (pair[1].onCollisionExit !== undefined) pair[1].onCollisionExit(previousCollision);
            }
        });
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

    private static resolveCollision(c1 : Body, c2 : Body)
    {
        if (c1 instanceof CircleBody && c2 instanceof CircleBody)
        {
            // TODO: actually resolve collision instead of pushing away bodies
            Physics.pushAwayCircle(c1, c2);
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

    private static pushAwayCircle(cb1 : CircleBody, cb2 : CircleBody)
    {
        const massRatio = cb1.mass / cb2.mass;
        const nv = cb1.position.subtract(cb2.position).normalize();

        cb1.position = nv.multiplyScalar(massRatio).add(cb1.position);
        cb2.position = nv.multiplyScalar(-1 / massRatio).add(cb2.position);
    }
}
