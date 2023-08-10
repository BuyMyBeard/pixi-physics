import { Body } from './Body';
import { CircleBody } from './CircleBody';

export class BodyFactory
{
    static createCircle() : Body
    {
        const circle = new CircleBody();

        return circle;
    }
}
