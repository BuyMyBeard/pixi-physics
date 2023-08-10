class LayerInteraction
{
    isTrue;
    constructor(interaction : boolean)
    {
        this.isTrue = interaction;
    }
}
class Layer
{
    index : number;
    name : string;
    interactions : LayerInteraction[] = [];

    constructor(index : number, name : string)
    {
        if (index === 0) this.addInteraction(0, new LayerInteraction(true));
        this.index = index;
        this.name = name;
    }

    addInteraction(index : number, interaction : LayerInteraction)
    {
        this.interactions[index] = interaction;
    }
    setInteraction(index : number, value : boolean)
    {
        this.interactions[index].isTrue = value;
    }
}

export class Layers
{
    private static layers = [new Layer(0, 'default')];

    public static addLayer(index : number, name : string, defaultInteraction = true)
    {
        if (index < 0 || index > 24 || !Number.isInteger(index)) throw new Error('Layers are indexed from 0 to 24');
        if (this.layers[index] !== undefined) throw new Error(`Layer ${index} exists already`);
        const layer = new Layer(index, name);

        this.layers[index] = layer;
        this.layers.forEach((layer2, index2) =>
        {
            const interaction = new LayerInteraction(defaultInteraction);

            layer.addInteraction(index2, interaction);
            layer2.addInteraction(index, interaction);
        });
    }

    public static setInteraction(layer1 : number | string, layer2 : number | string, interaction : boolean)
    {
        const l1 = this.getLayer(layer1);
        const l2 = this.getLayer(layer2);

        if (l1 === undefined) throw new Error(`Layer ${layer1} is undefined`);
        if (l2 === undefined) throw new Error(`Layer ${layer2} is undefined`);

        l1.interactions[l2.index].isTrue = interaction;
    }

    public static getInteraction(layer1 : number | string, layer2 : number | string)
    {
        const l1 = this.getLayer(layer1);
        const l2 = this.getLayer(layer2);

        if (l1 === undefined) throw new Error(`Layer ${layer1} is undefined`);
        if (l2 === undefined) throw new Error(`Layer ${layer2} is undefined`);

        return l1.interactions[l2.index].isTrue;
    }

    private static getLayer(layer : number | string)
    {
        if (typeof layer === 'number') return this.layers[layer];

        return this.layers.find((l) => l.name === layer);
    }

    public static layerExists(layer : number | string)
    {
        return this.getLayer(layer) !== undefined;
    }
}
