class KeysPressed
{
    public Up = false;
    public Down = false;
    public Left = false;
    public Right = false;
    public Attack = false;
    public Interact = false;
    public Pause = false;
    public get None()
    {
        return !this.any();
    }

    public getAnyTrue() : inputTypes | boolean
    {
        if (this.None)
        {
            return false;
        }
        // return Object.keys(this).find(this => this.val)
        return true;
    }

    public reset()
    {
        Object.values(this).some((val) => val = false);
    }
    public any() : boolean
    {
        return Object.values(this).some((val) => val);
    }
}

export type inputTypes = 'Up' | 'Down' | 'Left' | 'Right' | 'Attack' | 'Interact' | 'Pause' | 'None';

export class InputSystem
{
    // à clear à chaque loop cycle. Permet de savoir ce qui a été appuyé entre 2 frames;
    public static keysPressed : KeysPressed = new KeysPressed();

    public static initialize()
    {
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);
    }

    public static get currentInput() : inputTypes
    {
        if (this.inputStack.length == 0)
        {
            return 'None';
        }

        return this.inputStack[0];
    }
    private static inputStack : Array<inputTypes> = [];

    public static onKeyDown(e : any)
    {
        const inputType : inputTypes = InputSystem.keyToInputType(e.key);

        if (inputType !== 'None' && InputSystem.inputStack.indexOf(inputType) === -1)
        {
            InputSystem.inputStack.unshift(inputType);
        }
    }

    public static onKeyUp(e : any)
    {
        const inputType : inputTypes = InputSystem.keyToInputType(e.key);

        if (inputType !== 'None')
        {
            InputSystem.inputStack = InputSystem.inputStack.filter((input) => input !== inputType);
        }
    }

    private static keyToInputType(key : string) : inputTypes
    {
        let inputType : inputTypes = 'None';

        switch (key)
        {
            case 'w':
            case 'ArrowUp':
                inputType = 'Up';
                break;

            case 'a':
            case 'ArrowLeft':
                inputType = 'Left';
                break;

            case 'd':
            case 'ArrowRight':
                inputType = 'Right';
                break;

            case 's':
            case 'ArrowDown':
                inputType = 'Down';
                break;

            case 'p':
            case 'Escape':
                inputType = 'Pause';
                break;

            case 'Enter':
            case ' ':
                inputType = 'Attack';
                break;

            case 'e':
            case 'Control':
                inputType = 'Interact';
                break;

            default:
                inputType = 'None';
                break;
        }

        return inputType;
    }
}
