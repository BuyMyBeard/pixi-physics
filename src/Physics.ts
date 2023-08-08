import { Point } from 'pixi.js';
import { Body } from './Body';
import { Collision } from './Collision';
import { sweepAndPrune } from './SAP';
import { MathUtils } from './MathUtils';

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
                // this.respondToCollision(collision);
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
            Physics.respondToCollision2(collision);
        });
    }

    private static respondToCollision2(collision : Collision)
    {
        const A = collision.c1;
        const B = collision.c2;
        const centroidA = A.centroid;
        const centroidB = B.centroid;
        const n = collision.normal;

        const staticFriction = Math.max(A.staticFriction, B.staticFriction);
        const kineticFriction = Math.max(A.kineticFriction, B.kineticFriction);
        const e = Math.min(A.bounciness, B.bounciness);

        if (collision.contacts === undefined) throw new Error('Collision contacts are undefined');
        for (const contact of collision.contacts)
        {
            const ra = contact.subtract(centroidA);
            const rb = contact.subtract(centroidB);
            const raPerp = new Point(-ra.y, ra.x);
            const rbPerp = new Point(-rb.y, rb.x);

            const angularLinearVelocityA = raPerp.multiplyScalar(A.angularVelocity);
            const angularLinearVelocityB = rbPerp.multiplyScalar(B.angularVelocity);

            const relativeVelocity = A.velocity
                .add(angularLinearVelocityA)
                .subtract(B.velocity)
                .subtract(angularLinearVelocityB);

            if (relativeVelocity.dot(n) > 0) continue;

            const numerator = -(1 + e) * relativeVelocity.dot(n);
            const denom1 = ((1 / A.mass) + (1 / B.mass)) / collision.contacts.length;
            const denom2 = Math.pow(raPerp.dot(n), 2) / A.inertia;
            const denom3 = Math.pow(rbPerp.dot(n), 2) / B.inertia;
            const j = numerator / (denom1 + denom2 + denom3);

            const impulse = n.multiplyScalar(j);

            A.addTorque(ra.cross(impulse) / A.inertia);
            B.addTorque(-rb.cross(impulse) / B.inertia);
            A.addForce(impulse.multiplyScalar(1 / A.mass));
            B.addForce(impulse.multiplyScalar(-1 / B.mass));

            let tangent = relativeVelocity.subtract(n.multiplyScalar(relativeVelocity.dot(n)));

            if (MathUtils.nearlyEqualPoint(tangent, new Point(0, 0))) continue;

            tangent = tangent.normalize();

            const numeratorT = -relativeVelocity.dot(tangent);
            const denom1T = ((1 / A.mass) + (1 / B.mass)) / collision.contacts.length;
            const denom2T = Math.pow(raPerp.dot(tangent), 2) / A.inertia;
            const denom3T = Math.pow(rbPerp.dot(tangent), 2) / B.inertia;
            const jt = numeratorT / (denom1T + denom2T + denom3T);

            let frictionImpulse;

            if (Math.abs(jt) <= j * staticFriction) frictionImpulse = tangent.multiplyScalar(jt);
            else frictionImpulse = tangent.multiplyScalar(-jt * kineticFriction);

            A.addTorque(-ra.cross(frictionImpulse) / A.inertia);
            B.addTorque(rb.cross(frictionImpulse) / B.inertia);
            A.addForce(frictionImpulse.multiplyScalar(-1 / A.mass));
            B.addForce(frictionImpulse.multiplyScalar(1 / B.mass));
        }
    }

    private static respondToCollision(collision : Collision)
    {
        const unitTangent = new Point(-collision.normal.y, collision.normal.x);
        const resultingBounciness = (collision.c1.bounciness + collision.c2.bounciness) / 2;
        const resultingFriction = (collision.c1.staticFriction + collision.c2.staticFriction) / 2;

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
