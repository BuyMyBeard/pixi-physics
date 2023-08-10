import { Point, Rectangle } from 'pixi.js';
import { Body, BodyParameters } from './Body';
import { ObservableTransform } from '../Utils/ObservableTransform';

interface BallParameters extends BodyParameters
{
    radius? : number;
}
export class CircleBody extends Body
{
    protected override updateInertia(): void
    {
        this._inertia = 0.5 * this.mass * this.radius * this.radius;
    }
    protected _rawRadius = 50;
    protected _radius = 50;

    public override get centroid(): Point
    {
        return this.getGlobalPosition();
    }
    /**
     * Radius of circle.
     *
     * Setting this to a value of 0 or below will set it to 5e-324
    */
    public get radius()
    {
        return this._radius;
    }

    // TODO: Modify scale of DisplayObject depending on radius change
    public set radius(value : number)
    {
        if (value <= 0) value = Number.MIN_VALUE;
        const ratio = this._rawRadius / this.radius;

        this._rawRadius = value * ratio;
        this._radius = value;
    }

    /**
     * Instanciates a Circle Body
     * @param params Optional parameters for giving the Circle Body different properties
     */
    constructor(params? : BallParameters)
    {
        super();
        Object.assign(this, params);
        const color = params === undefined || params.color === undefined ? 0xAA0000 : params.color;

        if (params !== undefined && params.lineStyle !== undefined) this.graphics.lineStyle(params.lineStyle);
        this.graphics.beginFill(color);
        this.graphics.drawCircle(0, 0, this.radius);
        this.graphics.moveTo(0, 0);
        this.graphics.lineTo(0, this.radius);

        this.updateBoundingBox(true);
        this.updateInertia();
        this.updateRadius();

        this.mass = params === undefined || params.mass === undefined
            ? this.radius * this.radius * Math.PI * this.density : params.mass;
    }

    public updateBoundingBox(forceUpdate = false)
    {
        if (forceUpdate || (this.transform as ObservableTransform).changed)
        {
            (this.transform as ObservableTransform).reset();
            this.transform.updateTransform(this.parent.transform);
            const pos = this.getGlobalPosition();

            this._boundingBox = new Rectangle(pos.x - this.radius, pos.y - this.radius, this.radius * 2, this.radius * 2);
        }
    }

    protected updateRadius()
    {
        const r0 = this.transform.worldTransform.apply(new Point(0, 0));
        const r1 = this.transform.worldTransform.apply(new Point(this._rawRadius, 0));

        this._radius = r1.subtract(r0).magnitude();
    }
    /**
     * Checks if the point passed as parameter is contained within this circle
     * @param point Position to check
     * @returns True if position is within circle, false otherwise
     */
    public contains(point : Point) : boolean
    {
        return this.getGlobalPosition().subtract(point).magnitude() <= this.radius;
    }
}
