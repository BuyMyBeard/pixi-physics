import { Point } from 'pixi.js';
import { Body } from '../Body/Body';
import { Collision } from './Collision';
import { BroadPhase, SweepAndPrune, GridPartition, CheckEveryUniquePair } from './BroadPhase';
import { KDTree } from './KDTree';
import { MathUtils } from '../Utils/MathUtils';
import { Layers } from './Layers';

/** Static class that manages collisions every frame between bodies */
export class Physics
{
    private static contactsJVal : number[] = [];
    /** Currently applied broad phase algorithm to narrow the amount of pairs to test for collisions */
    static broadPhase : BroadPhase = new SweepAndPrune();
    /**
     * Applies a broad phase algorithm to the body pool,
     * and checks for each pair in the narrow phase if the bodies intersect.
     * If they intersect, calls collision events, resolves bodies overlaps and adds
     * physics responses to bodies.
     */
    static checkForCollisions()
    {
        const listOfPairs = this.broadPhase.apply(Body.bodyPool);
        const newCollisions : Collision[] = [];
        let queuedResolutions : [Body, Point][] = [];

        listOfPairs.forEach((pair) =>
        {
            if (!Layers.getInteraction(pair[0].layer, pair[1].layer)) return;
            const index = Collision.collisionIndex(pair);
            const collision = Collision.test(pair[0], pair[1]);

            if (index === -1 && collision)
            {
                if (pair[0].onCollisionEnter !== undefined) pair[0].onCollisionEnter(collision);
                if (pair[1].onCollisionEnter !== undefined) pair[1].onCollisionEnter(collision);
                if (!collision.isTrigger) queuedResolutions = [...queuedResolutions, ...Physics.resolveCollision(collision)];
                newCollisions.push(collision);
            }
            else if (collision && index !== -1)
            {
                Collision.collisionsInProgress[index] = collision;
                if (pair[0].onCollisionStay !== undefined) pair[0].onCollisionStay(collision);
                if (pair[1].onCollisionStay !== undefined) pair[1].onCollisionStay(collision);
                if (!collision.isTrigger) queuedResolutions = [...queuedResolutions, ...Physics.resolveCollision(collision)];
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
            if (!collision.isTrigger) Physics.respondToCollision(collision);
        });
    }
    /**
     * Adds linear and angular impulses to bodies to respond to collisions.
     * Follows the implementation suggested in the article "Physics, Part 3: Collision Response",
     * found here: http://www.chrishecker.com/Rigid_Body_Dynamics
     *
     * @param collision Collision information
     */
    private static respondToCollision(collision : Collision)
    {
        const jTuple : [number, number] = [0, 0];

        this.addNormalResponse(collision, jTuple);
        // this.addTangentResponse(collision, jTuple);
    }

    private static addNormalResponse(collision : Collision, jTuple : [number, number])
    {
        const A = collision.c1;
        const B = collision.c2;
        const centroidA = A.centroid;
        const centroidB = B.centroid;
        const n = collision.normal;
        const e = Math.min(A.bounciness, B.bounciness);
        const torqueA = 0;
        const torqueB = 0;
        const impulseA = new Point(0, 0);
        const impulseB = new Point(0, 0);

        collision.contacts.forEach((contact, index) =>
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

            if (relativeVelocity.dot(n) > 0) return;

            const numerator = -(1 + e) * relativeVelocity.dot(n);
            const denom1 = ((1 / A.mass) + (1 / B.mass)) / collision.contacts.length;
            const denom2 = Math.pow(raPerp.dot(n), 2) / A.inertia;
            const denom3 = Math.pow(rbPerp.dot(n), 2) / B.inertia;
            const j = numerator / (denom1 + denom2 + denom3);

            jTuple[index] = j;
            const impulse = n.multiplyScalar(j);

            A.addTorque(ra.cross(impulse) / A.inertia);
            B.addTorque(-rb.cross(impulse) / B.inertia);
            A.addForce(impulse.multiplyScalar(1 / A.mass));
            B.addForce(impulse.multiplyScalar(-1 / B.mass));
        });
    }
    private static addTangentResponse(collision : Collision, jTuple : [number, number])
    {
        const A = collision.c1;
        const B = collision.c2;
        const centroidA = A.centroid;
        const centroidB = B.centroid;
        const n = collision.normal;
        const staticFriction = Math.max(A.staticFriction, B.staticFriction);
        const kineticFriction = Math.max(A.kineticFriction, B.kineticFriction);
        let torqueA = 0;
        let torqueB = 0;
        const impulseA = new Point(0, 0);
        const impulseB = new Point(0, 0);

        collision.contacts.forEach((contact, index) =>
        {
            const ra = contact.subtract(centroidA);
            const rb = contact.subtract(centroidB);
            const raPerp = new Point(-ra.y, ra.x);
            const rbPerp = new Point(-rb.y, rb.x);

            const angularLinearVelocityA = raPerp.multiplyScalar(A.angularVelocity + A.angularImpulse);
            const angularLinearVelocityB = rbPerp.multiplyScalar(B.angularVelocity + A.angularImpulse);

            const relativeVelocity = A.velocity
                .add(A.impulse)
                .add(angularLinearVelocityA)
                .subtract(B.velocity)
                .subtract(B.impulse)
                .subtract(angularLinearVelocityB);

            let tangent = relativeVelocity.subtract(n.multiplyScalar(relativeVelocity.dot(n)));

            if (MathUtils.nearlyEqualPoint(tangent, new Point(0, 0))) return;

            tangent = tangent.normalize();

            const numeratorT = -relativeVelocity.dot(tangent);
            const denom1T = ((1 / A.mass) + (1 / B.mass)) / collision.contacts.length;
            const denom2T = Math.pow(raPerp.dot(tangent), 2) / A.inertia;
            const denom3T = Math.pow(rbPerp.dot(tangent), 2) / B.inertia;
            const jt = numeratorT / (denom1T + denom2T + denom3T);

            let frictionImpulse;

            const j = jTuple[index];

            if (j === undefined) throw new Error('j value is undefined');

            if (Math.abs(jt) <= j * staticFriction) frictionImpulse = tangent.multiplyScalar(jt);
            else frictionImpulse = tangent.multiplyScalar(-jt * kineticFriction);
            torqueA += -ra.cross(frictionImpulse) / A.inertia;
            torqueB += rb.cross(frictionImpulse) / B.inertia;
            impulseA.add(frictionImpulse.multiplyScalar(-1 / A.mass));
            impulseB.add(frictionImpulse.multiplyScalar(1 / B.mass));
        });
        A.addTorque(torqueA);
        B.addTorque(torqueB);
        A.addForce(impulseA);
        B.addForce(impulseB);
    }
    private static addSlop(impulse : Point)
    {
        const slop = 0.01;

        const signX = Math.sign(impulse.x);
        const signY = Math.sign(impulse.y);

        const biasX = Math.max(Math.abs(impulse.x) - slop, 0);
        const biasY = Math.max(Math.abs(impulse.y) - slop, 0);

        return new Point(biasX * signX, biasY * signY);
    }

    private static addAngularSlop(impulse : number)
    {
        const angularSlop = 0.00001;
        const angularVelocitySign = Math.sign(impulse);
        const biasAngularVelocity = Math.max(Math.abs(impulse) - angularSlop, 0);

        return angularVelocitySign * biasAngularVelocity;
    }

    /**
     * Finds resolutions to applied to bodies to push them outside each other
     * @param collision Collision information
     * @returns Tuple array of resolutions to be applied to bodies
     */
    private static resolveCollision(collision : Collision) : [Body, Point][]
    {
        const body1 = collision.c1;
        const body2 = collision.c2;

        const slop = 0;

        const moveDistance = collision.depth;
        const bias = Math.max(moveDistance - slop, 0);

        if (body1.isStatic)
        {
            return [[body2, collision.normal.multiplyScalar(-bias)]];
        }
        else if (body2.isStatic)
        {
            return [[body1, collision.normal.multiplyScalar(bias)]];
        }
        const resolution1 = collision.normal.multiplyScalar(bias / 2);
        const resolution2 = collision.normal.multiplyScalar(-bias / 2);

        if (body1.lockX && body2.lockX)
        {
            resolution1.x = 0;
            resolution2.x = 0;
        }
        else if (body1.lockX)
        {
            resolution1.x = 0;
            resolution2.x *= 2;
        }
        else if (body2.lockX)
        {
            resolution1.x *= 2;
            resolution2.x = 0;
        }
        if (body1.lockY && body2.lockY)
        {
            resolution1.y = 0;
            resolution2.y = 0;
        }
        else if (body1.lockY)
        {
            resolution1.y = 0;
            resolution2.y *= 2;
        }
        else if (body2.lockY)
        {
            resolution1.y *= 2;
            resolution2.y = 0;
        }

        return [[body1, resolution1],
            [body2, resolution2]];
    }

    /**
     * To call every frame in your update loop after applying movement and forces to bodies manually
     * @param deltaTime Timespan from last frame to this frame
     * @param substeps Defines how accurate the physics engine is, by default 8.
     * Raise value for more accurate physics with faster bodies, and lower it for performance increase
     */
    public static step(deltaTime : number, substeps = 8)
    {
        for (let i = 0; i < substeps; i++)
        {
            Physics.applyMovementToBodies(deltaTime / substeps);
            Physics.checkForCollisions();
        }
    }

    /**
     * Applies all linear and angular velocities, forces and impulses to bodies
     * @param deltaTime Timespan from last substep to this substep
     */
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
}
