import { Point } from 'pixi.js';
import { Body } from '../Body/Body';

export class Raycast
{
    public static ray(origin : Point, length = Number.POSITIVE_INFINITY, bodyList = Body.bodyPool)
    {
        let minDistance = length;

        for (const b of bodyList)
        {
            minDistance = 0;
        }
    }
}
