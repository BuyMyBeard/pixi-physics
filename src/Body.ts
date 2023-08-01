import { Graphics, Point, Container, Sprite } from 'pixi.js';
import { app } from '.';
import '@pixi/math-extras';
import { ObservableTransform } from './ObservableTransform';

export type BodyType = 'Dynamic' | 'Kinematic' | 'Static';

/**
 * Parent class of all physics bodies
 */
export abstract class Body extends Container
{
    public override transform : ObservableTransform;
    static bodyPool : Body[] = [];
    public velocity : Point = new Point(0, 0);
    public acceleration : Point = new Point(0, 0);
    public readonly density : number = 1;
    public bounciness = 1;
    public friction = 0;
    public bodyType : BodyType = 'Dynamic';
    public mass = 1;
    protected queuedResponse : Point | null = null;
    public graphics = new Graphics();
    public sprite = new Sprite();

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

    abstract get boundingBoxCorner() : Point;
    abstract get boundingBoxWidth() : number;
    abstract get boundingBoxHeight() : number;

    public queueResponse(velocity : Point)
    {
        if (this.queuedResponse === null)
        {
            this.queuedResponse = velocity;
        }
        else
        {
            this.queuedResponse.add(velocity);
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
    // public static collisionIndex(pair : [Body, Body]) : number
    // {
    //     for (let i = 0; i < Collision.collisionsInProgress.length; i++)
    //     {
    //         if (Collision.collisionsInProgress[i].containsColliders(pair[0], pair[1]))
    //         {
    //             return i;
    //         }
    //     }

    //     return -1;
    // }
    public update(deltaTime : number)
    {
        if (this.queuedResponse !== null)
        {
            this.velocity = this.queuedResponse.clone();
            this.queuedResponse = null;
        }
        this.velocity = this.velocity.add(this.acceleration.multiplyScalar(deltaTime));

        this.x += this.velocity.x * deltaTime;
        this.y += this.velocity.y * deltaTime;
    }
}
