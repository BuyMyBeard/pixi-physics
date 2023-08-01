import { Body } from './Body';
export function sweepAndPrune(colliders : Array<Body>) : Array<[Body, Body]>
{
    const active : Set<Body> = new Set();
    const listOfPairs : Array<[Body, Body]> = [];

    colliders.sort((c1, c2) => c1.boundingBoxCorner.x - c2.boundingBoxCorner.x);
    for (const c of colliders)
    {
        if (active.size === 0)
        {
            active.add(c);
            continue;
        }

        const minBoundary = c.boundingBoxCorner.x;
        const maxBoundary = c.boundingBoxCorner.x + c.boundingBoxWidth;

        for (const a of active)
        {
            const minBoundary2 = a.boundingBoxCorner.x;
            const maxBoundary2 = a.boundingBoxCorner.x + a.boundingBoxWidth;

            if (maxBoundary2 < minBoundary || maxBoundary < minBoundary2)
            {
                active.delete(a);
            }
            else
            {
                listOfPairs.push([c, a]);
            }
        }
        active.add(c);
    }

    return listOfPairs;
}

