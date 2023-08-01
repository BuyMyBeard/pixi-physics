import { Transform } from 'pixi.js';

export class ObservableTransform extends Transform
{
    protected _savedWorldID : number;
    protected _savedLocalID : number;
    constructor()
    {
        super();
        this._savedWorldID = this._worldID;
        this._savedLocalID = this._localID;
    }
    public reset() {
        this._savedWorldID = this._worldID;
        this._savedLocalID = this._localID;
    }
    public get changed()
    {
        return this._savedLocalID !== this._localID || this._savedWorldID !== this._worldID;
    }
}
