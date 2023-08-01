import { Body } from './Body';
export function sweepAndPrune(colliders : Array<Body>) : Array<[Body, Body]>
{
    const active : Set<Body> = new Set();
    const listOfPairs : Array<[Body, Body]> = [];

    colliders.sort((c1, c2) => c1.boundingBox.x - c2.boundingBox.x);
    for (const c of colliders)
    {
        if (active.size === 0)
        {
            active.add(c);
            continue;
        }

        const minBoundary = c.boundingBox.x;
        const maxBoundary = c.boundingBox.x + c.boundingBox.width;

        for (const a of active)
        {
            const minBoundary2 = a.boundingBox.x;
            const maxBoundary2 = a.boundingBox.x + a.boundingBox.width;

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

