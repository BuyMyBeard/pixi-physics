import { Body, BodyParameters } from './Body';
import { ColorSource, Point, Rectangle } from 'pixi.js';
import { MathUtils, Segment } from '../Utils/MathUtils';
import { ObservableTransform } from '../Utils/ObservableTransform';

export class PolygonBody extends Body
{
    public override updateInertia(): void {
        if (this.isStatic)
        {
            this._inertia = Number.POSITIVE_INFINITY;
            this.mass = Number.POSITIVE_INFINITY;
            return;
        }
        this._inertia = 1 / 12 * this.mass * ((this.boundingBox.width * this.boundingBox.width)
            + (this.boundingBox.height * this.boundingBox.height));

        // let topSum = 0;
        // let bottomSum = 0;
        // const verticeCount = this.vertices.length;

        // for (let i = 0; i < verticeCount; i++)
        // {
        //     const v0 = this.vertices[i];
        //     const v1 = this.vertices[(i + 1) % verticeCount];
        //     const crossMagnitude = Math.abs(v1.cross(v0));

        //     topSum += crossMagnitude * (v0.dot(v0) + v0.dot(v1) + v1.dot(v1));
        //     bottomSum += crossMagnitude;
        // }
        // this._inertia = this.mass * topSum / (6 * bottomSum);
    }
    _isConvex : boolean;
    rawVertices : Point[];
    public vertices : Point[];
    constructor(vertices : Point[], params? : BodyParameters)
    {
        super();
        if (vertices.length < 3)
        {
            throw new Error('Polygon needs at least 3 vertices');
        }
        // TODO: support concave polygons with polygon partitioning
        // if (!MathUtils.isConvexPolygon(vertices)) {
        //   throw new Error("Concave polygon not supported");
        // }
        this._isConvex = MathUtils.isConvexPolygon(vertices);
        this.rawVertices = vertices;
        Object.assign(this, params);
        this.transform.updateLocalTransform();
        this.transform.updateTransform(this.parent.transform);
        this.vertices = this.rawVertices.map((v) => this.transform.worldTransform.apply(v));
        this.updateBoundingBox(true);
        this.updateInertia();
        const color : ColorSource = params === undefined || params.color === undefined ? 0xFFFFFF : params.color;

        if (params !== undefined && params.lineStyle !== undefined) this.graphics.lineStyle(params.lineStyle);
        this.graphics.beginFill(color);
        this.graphics.drawPolygon(this.rawVertices);
        this.graphics.endFill();

        const centroid = this.transform.localTransform.applyInverse(this.centroid);
        const edgeMiddle = this.rawVertices[1].add(this.rawVertices[2].subtract(this.rawVertices[1]).multiplyScalar(0.5));

        this.graphics.moveTo(centroid.x, centroid.y);
        this.graphics.lineTo(edgeMiddle.x, edgeMiddle.y);
    }

    protected updateVertices()
    {
        this.vertices = this.rawVertices.map((v) => this.transform.worldTransform.apply(v));
    }

    public test(v : Point)
    {
        return this.collidesWithPoint(v);
    }

    public updateBoundingBox(forceUpdate = false)
    {
        if (forceUpdate || (this.transform as ObservableTransform).changed)
        {
            (this.transform as ObservableTransform).reset();
            this.transform.updateTransform(this.parent.transform);

            this.updateVertices();

            const corner = this.vertices[0].clone();

            for (let i = 1; i < this.vertices.length; i++)
            {
                if (this.vertices[i].x < corner.x)
                {
                    corner.x = this.vertices[i].x;
                }
                if (this.vertices[i].y < corner.y)
                {
                    corner.y = this.vertices[i].y;
                }
            }
            let width = 0;
            let height = 0;

            for (const v of this.vertices)
            {
                if (width < v.x - corner.x) width = v.x - corner.x;
                if (height < v.y - corner.y) height = v.y - corner.y;
            }

            this._boundingBox = new Rectangle(corner.x, corner.y, width, height);
        }
    }

    public get edges() : Array<Segment>
    {
        const edges : Array<Segment> = [];
        const verticesCount = this.vertices.length;

        for (let i = 0; i < verticesCount; i++)
        {
            let secondVertex = i + 1;

            if (secondVertex === verticesCount)
            {
                secondVertex = 0;
            }
            edges.push([this.vertices[i], this.vertices[secondVertex]]);
        }

        return edges;
    }

    public get centroid()
    {
        const verticesSum = new Point(0, 0);

        this.vertices.forEach((v) => verticesSum.set(verticesSum.x + v.x, verticesSum.y + v.y));

        return verticesSum.multiplyScalar(1 / this.vertices.length);
    }

    public collidesWithPoint(point : Point) : boolean
    {
        const boundingBox = this.boundingBox;
        const pointOutside = new Point(boundingBox.x, boundingBox.y).add(new Point(-1, 0));
        const ray : Segment = [pointOutside, point];
        let intersectionCount = 0;

        for (const edge of this.edges)
        {
            if (this.segmentsIntersect2(ray, edge)) intersectionCount++;
        }

        return intersectionCount % 2 === 1;
    }

    public collidesWithPolygon(polygon : PolygonBody)
    {
        if (this.collidesWithPoint(polygon.vertices[0]) || polygon.collidesWithPoint(this.vertices[0]))
        {
            return true;
        }
        for (const s1 of this.edges)
        {
            for (const s2 of polygon.edges)
            {
                if (this.segmentsIntersect2(s1, s2))
                {
                    return true;
                }
            }
        }

        return false;
    }

    // Given three collinear points p, q, r, the function checks if
    // point q lies on line segment 'pr'
    private onSegment(p : Point, q : Point, r : Point) : boolean
    {
        return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x)
        && q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
    }

    // taken from https://www.geeksforgeeks.org/check-if-two-given-line-segments-intersect/
    private segmentsIntersect(s1 : Segment, s2 : Segment)
    {
        const o1 = MathUtils.orientation(s1[0], s1[1], s2[0]);
        const o2 = MathUtils.orientation(s1[0], s1[1], s2[1]);
        const o3 = MathUtils.orientation(s2[0], s2[1], s1[0]);
        const o4 = MathUtils.orientation(s2[0], s2[1], s1[1]);

        return (o1 !== o2 && o3 !== o4);
    }

    // taken from https://www.jeffreythompson.org/collision-detection/line-line.php
    private segmentsIntersect2(s1 : Segment, s2 : Segment)
    {
    // calculate the distance to intersection point
        const uA = (((s2[1].x - s2[0].x) * (s1[0].y - s2[0].y)) - ((s2[1].y - s2[0].y) * (s1[0].x - s2[0].x)))
        / (((s2[1].y - s2[0].y) * (s1[1].x - s1[0].x)) - ((s2[1].x - s2[0].x) * (s1[1].y - s1[0].y)));
        const uB = (((s1[1].x - s1[0].x) * (s1[0].y - s2[0].y)) - ((s1[1].y - s1[0].y) * (s1[0].x - s2[0].x)))
        / (((s2[1].y - s2[0].y) * (s1[1].x - s1[0].x)) - ((s2[1].x - s2[0].x) * (s1[1].y - s1[0].y)));

        // if uA and uB are between 0-1, lines are colliding
        return uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1;
    }
}