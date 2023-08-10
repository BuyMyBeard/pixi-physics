import { Body, BodyParameters } from './Body';
import { ColorSource, Point, Rectangle } from 'pixi.js';
import { MathUtils, Segment } from '../Utils/MathUtils';
import { ObservableTransform } from '../Utils/ObservableTransform';

export class PolygonBody extends Body
{
    protected override updateInertia(): void
    {
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
    /** Tells if polygon is convex or concave */
    public readonly isConvex : boolean = true;
    private _rawVertices : Point[];
    /** Current transformed vertices of polygon in world space. Modifying this may cause unintended physics behaviour. */
    public vertices : Point[];
    constructor(vertices : Point[], params? : BodyParameters)
    {
        super();
        if (vertices.length < 3)
        {
            throw new Error('Polygon needs at least 3 vertices');
        }
        // TODO: support concave polygons with polygon partitioning
        this.isConvex = MathUtils.isConvexPolygon(vertices);
        if (!this.isConvex)
        {
            throw new Error('Concave polygon not supported');
        }
        this._rawVertices = vertices;
        Object.assign(this, params);
        this.transform.updateLocalTransform();
        this.transform.updateTransform(this.parent.transform);
        this.vertices = this._rawVertices.map((v) => this.transform.worldTransform.apply(v));
        this.updateBoundingBox(true);
        this.updateInertia();
        const color : ColorSource = params === undefined || params.color === undefined ? 0xFFFFFF : params.color;

        if (params !== undefined && params.lineStyle !== undefined) this.graphics.lineStyle(params.lineStyle);
        this.graphics.beginFill(color);
        this.graphics.drawPolygon(this._rawVertices);
        this.graphics.endFill();

        const centroid = this.transform.localTransform.applyInverse(this.centroid);
        const edgeMiddle = this._rawVertices[1].add(this._rawVertices[2].subtract(this._rawVertices[1]).multiplyScalar(0.5));

        this.graphics.moveTo(centroid.x, centroid.y);
        this.graphics.lineTo(edgeMiddle.x, edgeMiddle.y);
    }

    protected updateVertices()
    {
        this.vertices = this._rawVertices.map((v) => this.transform.worldTransform.apply(v));
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

    /**
     * Returns line segments of each edge of the polygon. Modifying the point values may cause unintended physics behaviour.
     */
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

    /**
     * Checks if the point passed as parameter is contained within this polygon
     * @param point Position to check
     * @returns True if position is within polygon, false otherwise
     */
    public contains(point : Point) : boolean
    {
        const boundingBox = this.boundingBox;
        const pointOutside = new Point(boundingBox.x, boundingBox.y).add(new Point(-1, 0));
        const ray : Segment = [pointOutside, point];
        let intersectionCount = 0;

        for (const edge of this.edges)
        {
            if (MathUtils.segmentsIntersect2(ray, edge)) intersectionCount++;
        }

        return intersectionCount % 2 === 1;
    }
}
