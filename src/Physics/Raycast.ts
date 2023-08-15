import { Circle, Point } from 'pixi.js';
import { Body } from '../Body/Body';
import { Segment } from '../Utils/MathUtils';

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
    public static lineIntersectCircle([s1, s2] : Segment, circle : Circle) : Point[]
    {
        const delta = s2.subtract(s1);
        const lengthSqr = delta.magnitudeSquared();
        const determinant = ((s1.x - circle.x) * (s2.y - circle.y)) - ((s2.x - circle.x) * (s1.y - circle.y));

        const incidence = (circle.radius * circle.radius * lengthSqr) - (determinant * determinant);

        if (incidence < 0) return [];
        if (incidence === 0)
        {
            const x = determinant * delta.y / (lengthSqr);
            const y = -determinant * delta.x / (lengthSqr);

            return [new Point(x + circle.x, y + circle.y)];
        }
        const rightX = Math.sign(delta.y) * delta.x * Math.sqrt(incidence) / lengthSqr;
        const rightY = Math.abs(delta.y) * Math.sqrt(incidence) / lengthSqr;

        const leftX = determinant * delta.y / lengthSqr;
        const leftY = -determinant * delta.x / lengthSqr;

        const x1 = leftX + rightX;
        const x2 = leftX - rightX;
        const y1 = leftY + rightY;
        const y2 = leftY - rightY;

        return [new Point(x1 + circle.x, y1 + circle.y), new Point(x2 + circle.x, y2 + circle.y)];
    }
}
