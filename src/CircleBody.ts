import { IPointData, Point } from 'pixi.js';
import { Body, BodyType } from './Body';

type BallParameters = {
    position? : Point;
    velocity? : Point;
    acceleration? : Point;
    radius? : number;
    bodyType? : BodyType;
    friction? : number;
    bounciness? : number;
    density? : number;
    color? : number;
    mass? : number;
};
export class CircleBody extends Body
{
    override get boundingBoxCorner(): Point
    {
        return this.getGlobalPosition().subtract(new Point(this.radius, this.radius));
    }
    override get boundingBoxWidth(): number
    {
        return this.radius * 2;
    }
    override get boundingBoxHeight(): number
    {
        return this.boundingBoxWidth;
    }

    public readonly radius : number = 50;

    constructor(params? : BallParameters)
    {
        super();
        Object.assign(this, params);
        const color : number = params === undefined || params.color === undefined ? 0xAA0000 : params.color;

        this.graphics.beginFill(color);
        this.graphics.drawCircle(0, 0, this.radius);
        this.mass = params === undefined || params.mass === undefined
            ? this.radius * this.radius * Math.PI * this.density : params.mass;
    }

    public collidesWithPoint(point : IPointData) : boolean
    {
        return this.getGlobalPosition().subtract(point).magnitude() <= this.radius;
    }
}
