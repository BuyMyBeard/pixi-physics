import { IPointData, Point, Rectangle } from 'pixi.js';
import { Body, BodyParameters } from './Body';
import { ObservableTransform } from './ObservableTransform';

interface BallParameters extends BodyParameters
{
    radius? : number;
}
export class CircleBody extends Body
{
    public override updateInertia(): void {
        this._inertia = 0.5 * this.mass * this.radius * this.radius;
    }
    protected _rawRadius = 50;
    protected _radius = 50;

    public override get centroid(): Point {
        return this.getGlobalPosition();
    }
    public get radius()
    {
        return this._radius;
    }

    public set radius(value : number)
    {
        if (value <= 0) value = 1;
        const ratio = this._rawRadius / this.radius;

        this._rawRadius = value * ratio;
        this._radius = value;
    }

    constructor(params? : BallParameters)
    {
        super();
        Object.assign(this, params);
        const color = params === undefined || params.color === undefined ? 0xAA0000 : params.color;

        if (params !== undefined && params.lineStyle !== undefined) this.graphics.lineStyle(params.lineStyle);
        this.graphics.beginFill(color);
        this.graphics.drawCircle(0, 0, this.radius);
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

    public pointInside(point : IPointData) : boolean
    {
        return this.getGlobalPosition().subtract(point).magnitude() <= this.radius;
    }
}
