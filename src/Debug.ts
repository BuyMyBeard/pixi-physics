import { ColorSource, Graphics } from "pixi.js"
import { app } from ".";

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
}