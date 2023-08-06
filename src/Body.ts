import { Graphics, Point, Container, Sprite, ColorSource, ILineStyleOptions, Rectangle } from 'pixi.js';
import { app } from '.';
import '@pixi/math-extras';
import { ObservableTransform } from './ObservableTransform';
import { Collision } from './Collision';

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
    protected _boundingBox : Rectangle = new Rectangle();
    // public override transform : ObservableTransform;
    protected _force = new Point(0, 0);
    protected _impulse = new Point(0, 0);
    protected _inertia = -1;
    static bodyPool : Body[] = [];
    public velocity : Point = new Point(0, 0);
    public angularVelocity = 0;
    public acceleration : Point = new Point(0, 0);
    public readonly density : number = 1;
    public bounciness = 1;
    public friction = 0;
    public isStatic = false;
    public mass = 1;
    protected queuedResponse? : Point;
    protected queuedResolution? : Point;
    public graphics = new Graphics();
    public sprite = new Sprite();
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

    public get boundingBox() : Rectangle
    {
        return this._boundingBox;
    }

    public get force()
    {
        return this._force.clone();
    }
    public get impulse()
    {
        return this._impulse.clone();
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

    public resetInpulse()
    {
        this._impulse.set(0, 0);
    }

    /**
     *
     * @param force force added in pixels/s;
     * @param inpulse true by default, if false, force will be applied every frame
     */
    public addForce(force : Point, inpulse = true)
    {
        if (inpulse) this._impulse.set(this._impulse.x + force.x, this._impulse.y + force.y);
        else this._force.set(this._force.x + force.x, this._force.y + force.y);
    }
}
