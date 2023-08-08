import { ColorSource, Point } from 'pixi.js';
import { Body, BodyParameters } from './Body';

export class CapsuleBody extends Body
{
    constructor(width: number, height: number, params : BodyParameters)
    {
        if (width <= 0 || height <= 0) throw new Error('Capsule body constructor needs a positive width and height');
        super();
        Object.assign(this, params);
        const color = params === undefined || params.color === undefined ? 0xAA0000 : params.color;

        if (params !== undefined && params.lineStyle !== undefined) this.graphics.lineStyle(params.lineStyle);

        this.drawShape(width, height, color);
        // this.updateBoundingBox(true);
        // this.updateInertia();
    }

    private drawShape(width : number, height : number, color : ColorSource)
    {
        if (width > height)
        {
            const radius = height / 2;
            const halfRectangleWidth = (width - height) / 2;

            this.graphics.beginFill(color);
            this.graphics.arc(halfRectangleWidth, 0, radius, Math.PI * 3 / 2, 1 / 2 * Math.PI);
            this.graphics.lineTo(-halfRectangleWidth, radius);
            this.graphics.arc(-halfRectangleWidth, 0, radius, 1 / 2 * Math.PI, Math.PI * 3 / 2);
            this.graphics.lineTo(halfRectangleWidth, -radius);
            this.graphics.endFill();
        }
        else
        {
            const radius = width / 2;
            const halfRectangleHeight = (height - width) / 2;

            this.graphics.beginFill(color);
            this.graphics.arc(0, -halfRectangleHeight, radius, Math.PI, 0);
            this.graphics.lineTo(radius, halfRectangleHeight);
            this.graphics.arc(0, halfRectangleHeight, radius, 0, Math.PI);
            this.graphics.lineTo(-radius, -halfRectangleHeight);
            this.graphics.endFill();
        }
    }

    public override updateBoundingBox(): void
    {
        throw new Error('Method not implemented.');
    }
    public override updateInertia(): void
    {
        throw new Error('Method not implemented.');
    }
    public override get centroid(): Point
    {
        throw new Error('Method not implemented.');
    }
}
