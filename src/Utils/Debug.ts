import { Color, ColorSource, Graphics, ILineStyleOptions, LineStyle, Point } from 'pixi.js';
import { app } from '..';

export class Debug
{
    public static color : ColorSource = 0xFFFF00;
    private static graphics : Graphics = new Graphics();
    public static initialize()
    {
        app.stage.addChild(this.graphics);
    }

    public static reset()
    {
        this.graphics.clear();
    }

    public static drawPoint(x : number, y : number)
    {
        this.graphics.beginFill(this.color);
        this.graphics.drawCircle(x, y, 2);
        this.graphics.endFill();
    }

    public static drawLine(x0 : number, y0 : number, x1 : number, y1 : number)
    {
        this.graphics.lineStyle({
            color: new Color(this.color).toNumber(),
            width: 1,
        });
        this.graphics.moveTo(x0, y0);
        this.graphics.lineTo(x1, y1);
    }
}
