/** Layer instance containing state for different layer interactions */
class Layer
{
    index : number;
    name : string;
    interactions : boolean[] = [];

    constructor(index : number, name : string)
    {
        if (index === 0) this.addInteraction(0, true);
        this.index = index;
        this.name = name;
    }

    addInteraction(index : number, interaction : boolean)
    {
        this.interactions[index] = interaction;
    }
    setInteraction(index : number, value : boolean)
    {
        this.interactions[index] = value;
    }
}

/**
 * Static class managing layers for collisions.
 *
 * Can contain up to 25 layers indexed from 0 to 24, with a string name for each.
 * By default, every body is part of layer 0, named 'default'.
 *
 * To create more layers, call Layers.addLayer(), and then set the interactions manually with Layers.setInteraction().
 */
export class Layers
{
    /** layer instances currently in use by layer manager */
    private static layers = [new Layer(0, 'default')];
    /**
     * Adds new layer to layer system
     * @param index layer index from 1 to 24
     * @param name Layer name, used alternatively to make Body layers more explicit
     * @param defaultInteraction Sets all interaction with existing layers to value, by default true
     */
    public static addLayer(index : number, name : string, defaultInteraction = true)
    {
        if (index < 0 || index > 24 || !Number.isInteger(index)) throw new Error('Layers are indexed from 0 to 24');
        if (this.layers[index] !== undefined) throw new Error(`Layer ${index} exists already`);
        const layer = new Layer(index, name);

        this.layers[index] = layer;
        this.layers.forEach((layer2, index2) =>
        {
            const interaction = defaultInteraction;

            layer.addInteraction(index2, interaction);
            layer2.addInteraction(index, interaction);
        });
    }
    /**
     * Sets the specific interaction of 2 layers
     * @param layer1 Index or name of first layer
     * @param layer2 Index or name of second layer
     * @param interaction If the bodies interact together
     */
    public static setInteraction(layer1 : number | string, layer2 : number | string, interaction : boolean)
    {
        const l1 = this.getLayer(layer1);
        const l2 = this.getLayer(layer2);

        if (l1 === undefined) throw new Error(`Layer ${layer1} is undefined`);
        if (l2 === undefined) throw new Error(`Layer ${layer2} is undefined`);

        l1.interactions[l2.index] = interaction;
        l2.interactions[l1.index] = interaction;
    }
    /**
     * Gets the specific interaction of 2 layers
     * @param layer1 Index or name of first layer
     * @param layer2 Index or name of second layer
     * @returns True if the 2 layers interact, false otherwise
     */
    public static getInteraction(layer1 : number | string, layer2 : number | string)
    {
        const l1 = this.getLayer(layer1);
        const l2 = this.getLayer(layer2);

        if (l1 === undefined) throw new Error(`Layer ${layer1} is undefined`);
        if (l2 === undefined) throw new Error(`Layer ${layer2} is undefined`);

        return l1.interactions[l2.index];
    }
    /**
     * Checks if layer exists in the layer manager.
     *
     * Mainly used by the setter of the layer property of a body to check if valid.
     * @param layer Index or name of layer
     * @returns True if exists, false otherwise
     */
    public static layerExists(layer : number | string)
    {
        return this.getLayer(layer) !== undefined;
    }

    /**
     * Finds layer in layer manager
     * @param layer Index or name of layer
     * @returns Layer in manager
     */
    private static getLayer(layer : number | string)
    {
        if (typeof layer === 'number') return this.layers[layer];

        return this.layers.find((l) => l.name === layer);
    }
}
