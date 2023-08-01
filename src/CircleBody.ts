import { IPointData, Point, Rectangle } from 'pixi.js';
import { Body, BodyParameters, BodyType } from './Body';

interface BallParameters extends BodyParameters
{
    radius? : number;
}
export class CircleBody extends Body
{
    public readonly radius : number = 50;
    constructor(params? : BallParameters)
    {
        super();
        Object.assign(this, params);
        const color = params === undefined || params.color === undefined ? 0xAA0000 : params.color;

        this.graphics.beginFill(color);
        this.graphics.drawCircle(0, 0, this.radius);
        this._boundingBox = this.updateBoundingBox();
        this.mass = params === undefined || params.mass === undefined
            ? this.radius * this.radius * Math.PI * this.density : params.mass;
    }

    protected updateBoundingBox()
    {
        const pos = this.getGlobalPosition();

        return new Rectangle(pos.x - this.radius, pos.y - this.radius, this.radius * 2, this.radius * 2);
    }

    public collidesWithPoint(point : IPointData) : boolean
    {
        return this.getGlobalPosition().subtract(point).magnitude() <= this.radius;
    }
}
