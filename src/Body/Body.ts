import { Graphics, Point, Container, Sprite, ColorSource, ILineStyleOptions, Rectangle, IDestroyOptions } from 'pixi.js';
import { app } from '..';
import '@pixi/math-extras';
import { ObservableTransform } from '../Utils/ObservableTransform';
import { Collision } from '../Physics/Collision';
import { Layers } from '../Physics/Layers';

// export type BodyType = 'Dynamic' | 'Kinematic' | 'Static';

export interface BodyParameters
{
    position? : Point;
    rotation? : number;
    scale? : Point;
    velocity? : Point;
    isStatic? : boolean;
    friction? : number;
    bounciness? : number;
    density? : number;
    color? : ColorSource;
    mass? : number;
    lineStyle? : ILineStyleOptions;
}

/**
 * Parent class of all physics bodies
 */
export abstract class Body extends Container
{
    protected _layer : number | string = 0;
    protected _boundingBox : Rectangle = new Rectangle();
    // public override transform : ObservableTransform;
    protected _force = new Point(0, 0);
    protected _impulse = new Point(0, 0);
    protected _torque = 0;
    protected _angularImpulse = 0;
    protected _inertia = -1;
    /**
     * If set to true, prevents physics from modifying the rotation of this body
     */
    public lockRotation = false;
    /**
     * If set to true, prevents physics from modifying the x value of this body
     */
    public lockX = false;
    /**
     * If set to true, prevents physics from modifying the y value of this body
     */
    public lockY = false;
    /**
     * Pool of bodies currently in use. Any Body instance will add itself automatically to the pool.
     * Please do not modify this array unless you know what you're doing.
     */
    static readonly bodyPool : Body[] = [];
    /**
     * Current linear velocity of body, in units / s
     */
    public velocity : Point = new Point(0, 0);
    /**
     * Current angular velocity of body, in radians / s
     */
    public angularVelocity = 0;
    /** Density to calculate mass with if mass is not provided */
    public readonly density : number = 1;
    /** How bouncy this body is. 0 is no elasticity at all, 1 is perfect elasticity */
    public bounciness = 1;
    /** Resistance to being moved against other surface while still. Should be greater than kinetic friction. */
    public staticFriction = 0.6;
    /** Resistance to being moved against other surface while in movement */
    public kineticFriction = 0.4;
    /** Body will not move */

    public isStatic = false;
    private _mass = 1;
    protected queuedResponse? : Point;
    protected queuedResolution? : Point;
    public graphics = new Graphics();
    public sprite = new Sprite();
    /**
     * If set to true, collision with other bodies will not apply physics but will call
     * OnCollisionEnter, OnCollisionStay, and OnCollisionExit
    */
    public isTrigger = false;
    /** Called when this body enters collision with another body */
    public onCollisionEnter? : (collision : Collision) => void;
    /** Called every frame when this body stays inside the collider of another body */
    public onCollisionStay? : (collision : Collision) => void;
    /** Called when this body exits the collider of another body */
    public onCollisionExit? : (collision : Collision) => void;

    constructor()
    {
        super();
        this.transform = new ObservableTransform();
        this.addChild(this.graphics);
        this.addChild(this.sprite);
        Body.bodyPool.push(this);
        app.stage.addChild(this);
        this.sortableChildren = true;
        this.graphics.zIndex = 2;
        this.sprite.zIndex = 1;
    }

    /**
     * This body's mass. Setting this to a value of 0 or below will automatically set it to 5e-324.
     * If isStatic = true, will return Infinity.
     */
    public get mass()
    {
        if (this.isStatic) return Number.POSITIVE_INFINITY;

        return this._mass;
    }
    public set mass(value : number)
    {
        if (value <= 0) this._mass = Number.MIN_VALUE;
        else this._mass = value;
    }
    /** This body's moment of inertia, used by physics engine. If isStatic = true, will return Infinity */
    public get inertia()
    {
        if (this.isStatic) return Number.POSITIVE_INFINITY;

        return this._inertia;
    }
    /** Bounding box of body used by the physics engine broad phase algorithm */
    public get boundingBox() : Rectangle
    {
        return this._boundingBox;
    }

    /** Current linear force applied every frame to the body in units / s */
    public get force()
    {
        return this._force.clone();
    }

    /** Current rotational force applied every frame to the body in radians / s  */
    public get torque()
    {
        return this._torque;
    }
    /** Lineal impulse applied on the next physics substep */
    public get impulse()
    {
        return this._impulse;
    }
    /** Angular impulse applied on the next physics substep */
    public get angularImpulse()
    {
        return this._angularImpulse;
    }
    /** This body's layer, by default 0. To change this, make sure to call Layers.addLayer() with the new layer first. */
    public get layer()
    {
        return this._layer;
    }
    public set layer(value : number | string)
    {
        if (!Layers.layerExists(value)) throw new Error(`Layer ${value} is undefined`);
        this._layer = value;
    }

    /** Updates body bounding box. Called by the physics engine. */
    public abstract updateBoundingBox() : void;

    protected abstract updateInertia() : void;

    /** Center of mass of body, used by physics engine to apply rotational physics and such. */
    public abstract get centroid() : Point;

    /** Called every frame by the physics engine. please do not call this. */
    public applyCurrentForce(deltaTime : number)
    {
        if (this.isStatic) return;
        const appliedForce = new Point(this.lockX ? 0 : this._force.x, this.lockY ? 0 : this._force.y);
        const appliedImpulse = new Point(this.lockX ? 0 : this._impulse.x, this.lockY ? 0 : this._impulse.y);

        this.velocity = this.velocity.add(appliedForce.multiplyScalar(deltaTime));
        this.velocity.set(this.velocity.x + appliedImpulse.x, this.velocity.y + appliedImpulse.y);

        if (!this.lockRotation)
        {
            this.angularVelocity += this._torque * deltaTime;
            this.angularVelocity += this._angularImpulse;
        }
        // if (this._impulse.x > 0.1 || this._impulse.y > 0.1 || this._angularImpulse > 0.1)
        // {
        //     console.log(this.name, this._impulse.x, this._impulse.y);
        //     console.log(this.name, this._angularImpulse);
        // }
        this._impulse.set(0, 0);
        this._angularImpulse = 0;
    }

    /**
     *
     * @param force Force added in units / s;
     * @param impulse Defines if force is applied instantly, otherwise force will be applied every frame. True by default.
     */
    public addForce(force : Point, impulse = true)
    {
        if (this.isStatic) return;
        if (impulse) this._impulse.set(this._impulse.x + force.x, this._impulse.y + force.y);
        else this._force.set(this._force.x + force.x, this._force.y + force.y);
    }

    /**
     *
     * @param force Force added in radians / s
     * @param impulse Defines if force is applied instantly, otherwise force will be applied every frame. True by default.
     * @returns
     */
    public addTorque(force : number, impulse = true)
    {
        if (this.isStatic) return;
        if (impulse) this._angularImpulse += force;
        else this._torque += force;
    }

    /**
     * Removes all internal references and listeners as well as removes children from the display list.
     * Do not use a Container after calling `destroy`.
     * @param options - Options parameter. A boolean will act as if all options
     *  have been set to that value
     * @param {boolean} [options.children=false] - if set to true, all the children will have their destroy
     *  method called as well. 'options' will be passed on to those calls.
     * @param {boolean} [options.texture=false] - Only used for child Sprites if options.children is set to true
     *  Should it destroy the texture of the child sprite
     * @param {boolean} [options.baseTexture=false] - Only used for child Sprites if options.children is set to true
     *  Should it destroy the base texture of the child sprite
     */
    public override destroy(options?: boolean | IDestroyOptions | undefined): void
    {
        super.destroy(options);
        const index = Body.bodyPool.findIndex((b) => b === this);

        Body.bodyPool.splice(index, 1);
    }
}
