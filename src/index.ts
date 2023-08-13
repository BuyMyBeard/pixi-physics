import { Application, Ticker, Point, Circle, FederatedPointerEvent, EventSystem, Container, Sprite } from 'pixi.js';
import { PolygonBody } from './Body/PolygonBody';
import { MathUtils } from './Utils/MathUtils';
import { Body } from './Body/Body';
import { Physics } from './Physics/Physics';
import { InputSystem } from './Utils/InputSystem';
import { ScreenContainer } from './ScreenContainer';
import { Debug } from './Utils/Debug';
import { CircleBody } from './Body/CircleBody';
import { Layers } from './Physics/Layers';
import { BinaryTree } from './Utils/BinaryTree';

export const app = new Application({
    view: document.getElementById('pixi-canvas') as HTMLCanvasElement,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    backgroundColor: 0xFFFFFF,
    width: window.innerWidth,
    height: window.innerHeight,
});

// const bt = new BinaryTree<string>();
// const data = Array.from('In computer science, an abstract syntax tree (AST), or just syntax tree, is a tree representation of the abstract syntactic structure of text (often source code) written in a formal language. Each node of the tree denotes a construct occurring in the text. The syntax is "abstract" in the sense that it does not represent every detail appearing in the real syntax, but rather just the structural or content-related details. For instance, grouping parentheses are implicit in the tree structure, so these do not have to be represented as separate nodes. Likewise, a syntactic construct like an if-condition-then statement may be denoted by means of a single node with three branches. This distinguishes abstract syntax trees from concrete syntax trees, traditionally designated parse trees. Parse trees are typically built by a parser during the source code translation and compiling process. Once built, additional information is added to the AST by means of subsequent processing, e.g., contextual analysis. Abstract syntax trees are also used in program analysis and program transformation systems.');



Layers.addLayer(1, 'balls', true);
Layers.addLayer(2, 'polygons', true);
// Layers.setInteraction(1, 2, false);
Layers.setInteraction(2, 2, false);

const vertices : Point[] = [
    new Point(-50, -50),
    new Point(50, -50),
    new Point(50, 50),
    new Point(-50, 50),
];
const vertices2 : Point[] = [
    new Point(100, 100),
    new Point(400, 200),
    new Point(400, 400),
    new Point(200, 400),
];
const platformVertices : Point[] = [
    new Point(-100, -5),
    new Point(100, -5),
    new Point(100, 5),
    new Point(-100, 5),
];

// for (let i = 0; i < 10; i++)
// {
//     const position = new Point(MathUtils.getRandom(70, app.view.width - 70), MathUtils.getRandom(70, app.view.height - 70));
//     const velocity = new Point((Math.random() * 6) - 3, (Math.random() * 6) - 3);
//     const isStatic = MathUtils.randomBool(0.1);
//     const lineStyle = {
//         width: 1,
//         color: isStatic ? 'red' : 'black',
//     };

//     const c = new CircleBody({
//         position,
//         // velocity,
//         radius: (Math.random() * 30) + 5,
//         color: Math.random() * 16777215,
//         lineStyle,
//         // isStatic,
//         mass: 1,
//         bounciness: 0.1,
//     });

//     c.layer = 'balls';
//     c.addForce(new Point(0, 0.2), false);
// }

// new CapsuleBody(200, 100, {
//     position: new Point(100, 300),
//     lineStyle: {
//         width: 1,
//         color: "black",
//     }
// })

// for (let i = 0; i < 10; i++)
// {
//     const position = new Point(MathUtils.getRandom(70, app.view.width - 70), MathUtils.getRandom(70, app.view.height - 70));
//     const velocity = new Point((Math.random() * 6) - 3, (Math.random() * 6) - 3);
//     const isStatic = MathUtils.randomBool(0.1);
//     const lineStyle = {
//         width: 1,
//         color: isStatic ? 'red' : 'black',
//     };

//     const p = new PolygonBody(vertices, {
//         position,
//         velocity,
//         color: Math.random() * 16777215,
//         lineStyle,
//         mass: 1,
//         bounciness: 0.1,
//         // isStatic,
//     });

//     p.layer = 2;
//     p.addForce(new Point(0, 0.2), false);
//     // p.angularVelocity = 0.05;
// }

// const c = new PolygonBody(vertices2, {
//     position: new Point(500, 500),
//     lineStyle: {
//         width: 1,
//         color: 0xFFFFFF,
//     },
//     color: 0xAAAAAA,
// });
// const c2 = new PolygonBody(vertices, {
//     position: new Point(-100, -100),
//     scale: new Point(1, 1),
//     lineStyle: {
//         width: 1,
//         color: '0x40EE40',
//     },
//     color: '0x000000',
//     mass: 1,
// });

new ScreenContainer();

// const platform1 = new PolygonBody(platformVertices, {
//     position: new Point(300, 200),
//     isStatic: true,
//     color: 'black',
//     rotation: Math.PI / 6,
//     scale: new Point(4, 1),
// });

// const platform2 = new PolygonBody(platformVertices, {
//     position: new Point(1000, 500),
//     isStatic: true,
//     color: 'black',
//     rotation: -Math.PI / 6,
//     scale: new Point(4, 1),
// });

// c2.onCollisionEnter = (c) => console.log(c);
// c2.onCollisionStay = () => console.log('stayed');
// c2.onCollisionExit = () => console.log('exited');

Debug.initialize();
Debug.color = 0xFF0000;
InputSystem.initialize();

function updateLoop(deltaTime : number)
{
    Debug.reset();
    // moveBodyWithInputs(deltaTime, c2, true);
    Physics.step(deltaTime, 16);
}

function moveBodyWithInputs(deltaTime : number, body : Body, addEnergy = false, speed = 5)
{
    const input = InputSystem.currentInput;

    switch (input)
    {
        case 'Left':
            if (addEnergy) body.velocity.set(-speed, 0);
            else body.x -= speed * deltaTime;
            break;

        case 'Right':
            if (addEnergy) body.velocity.set(speed, 0);
            else body.x += speed * deltaTime;
            break;

        case 'Up':
            if (addEnergy) body.velocity.set(0, -speed);
            else body.y -= speed * deltaTime;
            break;

        case 'Down':
            if (addEnergy) body.velocity.set(0, speed);
            else body.y += speed * deltaTime;
            break;

        case 'Attack':
            break;

        case 'Interact':
            body.rotation += 0.05 * deltaTime;
            break;

        case 'None':
            body.velocity.set(0, 0);
            break;
    }
}
type ShapeType = 'Circle' | 'Box';

let type : ShapeType = 'Box';

document.addEventListener('keydown', (ev) =>
{
    if (ev.key === 'b') type = 'Box';
    else if (ev.key === 'c') type = 'Circle';
});

Ticker.shared.add(updateLoop);

const clickContainer = new Sprite();

clickContainer.width = window.innerWidth;
clickContainer.height = window.innerHeight;
clickContainer.eventMode = 'static';
app.stage.addChild(clickContainer);

clickContainer.on('pointertap', (e : FederatedPointerEvent) =>
{
    const lineStyle = {
        width: 1,
        color: 'black',
    };
    const params = {
        position: new Point(e.globalX, e.globalY),
        color: Math.random() * 16777215,
        lineStyle,
        mass: 1,
        bounciness: 0.1,
    };

    if (type === 'Circle')
    {
        const p = new CircleBody(params);

        p.addForce(new Point(0, 0.2), false);
        p.name = `circle ${Body.bodyPool.length}`;
    }
    else if (type === 'Box')
    {
        const p = new PolygonBody(vertices, params);

        p.addForce(new Point(0, 0.2), false);
        p.name = `box ${Body.bodyPool.length}`;
    }
});
