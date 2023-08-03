import { Point } from 'pixi.js';
import { BodyParameters } from './Body';
import { PolygonBody } from './PolygonBody';

export class ScreenContainer
{
    topLeft = new Point(0,0);
    topRight = new Point(window.innerWidth, 0);
    bottomLeft = new Point(0, window.innerHeight);
    bottomRight = new Point(window.innerWidth, window.innerHeight);
    margin = 5;
    topV = [
        this.topLeft,
        this.topRight,
        this.topRight.add(new Point(0, this.margin)),
        this.topLeft.add(new Point(0, this.margin)),
    ];
    bottomV = [
        this.bottomLeft,
        this.bottomRight,
        this.bottomRight.add(new Point(0, -this.margin)),
        this.bottomLeft.add(new Point(0, -this.margin)),
    ];
    rightV = [
        this.bottomRight,
        this.topRight,
        this.topRight.add(new Point(-this.margin, 0)),
        this.bottomRight.add(new Point(-this.margin, 0)),
    ];
    leftV = [
        this.topLeft,
        this.bottomLeft,
        this.bottomLeft.add(new Point(this.margin, 0)),
        this.topLeft.add(new Point(this.margin, 0)),
    ];
    params : BodyParameters = {
        isStatic: true,
        color: 'grey',
    }
    constructor()
    {
        new PolygonBody(this.topV, this.params);
        new PolygonBody(this.bottomV, this.params);
        new PolygonBody(this.rightV, this.params);
        new PolygonBody(this.leftV, this.params);
    }
}
