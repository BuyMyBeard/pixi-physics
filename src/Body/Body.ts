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
    public readonly density : number = 1;
    public bounciness = 1;
    public staticFriction = 0.6;
    public kineticFriction = 0.4;
    public isStatic = false;
    public mass = 1;
    protected queuedResponse? : Point;
    protected queuedResolution? : Point;
    public graphics = new Graphics();
    public sprite = new Sprite();
    /**
     * If set to true, collision with other bodies will not apply physics but will call
     * OnCollisionEnter, OnCollisionStay, and OnCollisionExit
     */
    public isTrigger = false;
    /**
     * Called when this body enters collision with another body
     */
    public onCollisionEnter? : (collision : Collision) => void;
    /**
     * Called every frame when this body stays inside the collider of another body
     */
    public onCollisionStay? : (collision : Collision) => void;
    /**
     * Called when this body exits the collider of another body
     */
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

    public get inertia()
    {
        return this._inertia;
    }

    public get boundingBox() : Rectangle
    {
        return this._boundingBox;
    }

    public get force()
    {
        return this._force.clone();
    }
    public get torque()
    {
        return this._torque;
    }

    public get layer()
    {
        return this._layer;
    }
    public set layer(value : number | string)
    {
        if (!Layers.layerExists(value)) throw new Error(`Layer ${value} is undefined`);
        this._layer = value;
    }

    public abstract updateBoundingBox() : void;
    public abstract updateInertia() : void;
    public abstract get centroid() : Point;

    public queueResponse(velocity : Point)
    {
        if (this.queuedResponse === undefined)
        {
            this.queuedResponse = velocity;
        }
        else
        {
            this.queuedResponse.add(velocity);
        }
    }

    public queueResolution(translation : Point)
    {
        if (this.queuedResolution === undefined)
        {
            this.queuedResolution = translation;
        }
        else
        {
            this.queuedResolution.add(translation);
        }
    }

    public static getPairArray() : Array<[Body, Body]>
    {
        const arr : Array<[Body, Body]> = [];

        for (let i = 0; i < Body.bodyPool.length; i++)
        {
            for (let j = i + 1; j < Body.bodyPool.length; j++)
            {
                arr.push([Body.bodyPool[i], Body.bodyPool[j]]);
            }
        }

        return arr;
    }
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
        this._impulse.set(0, 0);
        this._angularImpulse = 0;
    }

    /**
     *
     * @param force force added in pixels/s;
     * @param impulse true by default, if false, force will be applied every frame
     */
    public addForce(force : Point, impulse = true)
    {
        if (this.isStatic) return;
        if (impulse) this._impulse.set(this._impulse.x + force.x, this._impulse.y + force.y);
        else this._force.set(this._force.x + force.x, this._force.y + force.y);
    }

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
