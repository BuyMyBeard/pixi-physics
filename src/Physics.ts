import { Point } from 'pixi.js';
import { Body } from './Body';
import { Collision } from './Collision';
import { sweepAndPrune } from './SAP';

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
                queuedResolutions = [...queuedResolutions, ...Physics.resolveCollision(collision)];
                newCollisions.push(collision);
                this.respondToCollision(collision);
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

        Collision.collisionsInProgress.forEach((collision) =>
        {
            Collision.findContacts(collision);
            // this.respondToCollision(collision);
        });
    }

    private static respondToCollision(collision : Collision)
    {
        console.log(`body1: (${collision.c1.position.x}, ${collision.c1.position.y}), body2: (${collision.c2.position.x}, ${collision.c2.position.y}), normal:(${collision.normal.x}, ${collision.normal.y})`)
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
            const body1Inpulse = v1nFinalVect.add(v1tFinalVect).subtract(collision.c1.velocity);
            const body2Inpulse = v2nFinalVect.add(v2tFinalVect).subtract(collision.c2.velocity);

            collision.c1.addForce(body1Inpulse);
            collision.c2.addForce(body2Inpulse);

            return;
        }
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
        const inpulse = vnFinalVect.add(vtFinalVect).subtract(rb.velocity);

        rb.addForce(inpulse);
    }

    private static resolveCollision(collision : Collision) : [Body, Point][]
    {
        const moveDistance = collision.depth;

        if (collision.c1.isStatic)
        {
            return [[collision.c2, collision.normal.multiplyScalar(-moveDistance)]];
        }
        else if (collision.c2.isStatic)
        {
            return [[collision.c1, collision.normal.multiplyScalar(moveDistance)]];
        }

        return [[collision.c1, collision.normal.multiplyScalar(moveDistance)],
            [collision.c2, collision.normal.multiplyScalar(-moveDistance)]];
    }

    public static step(deltaTime : number, substeps = 1)
    {
        for (let i = 0; i < substeps; i++)
        {
            Physics.applyMovementToBodies(deltaTime / substeps);
            Physics.checkForCollisions();
        }
    }

    private static applyMovementToBodies(deltaTime : number)
    {
        for (const b of Body.bodyPool)
        {
            if (b.isStatic) continue;
            b.applyCurrentImpulse();
            b.applyCurrentForce(deltaTime);
            b.x += b.velocity.x * deltaTime;
            b.y += b.velocity.y * deltaTime;
            b.rotation += b.angularVelocity * deltaTime;
            b.updateBoundingBox();
        }
    }

    public static raycast(origin : Point, length = Number.POSITIVE_INFINITY, bodyList = Body.bodyPool)
    {
        let minDistance = length;

        for (const b of bodyList)
        {
            minDistance = 0;
        }
    }
}
