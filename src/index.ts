import { Application, Ticker, Point, Circle } from 'pixi.js';
import { PolygonBody } from './Body/PolygonBody';
import { MathUtils } from './Utils/MathUtils';
import { Body } from './Body/Body';
import { Physics } from './Physics/Physics';
import { InputSystem } from './Utils/InputSystem';
import { ScreenContainer } from './ScreenContainer';
import { Debug } from './Utils/Debug';
import { CircleBody } from './Body/CircleBody';
import { Layers } from './Physics/Layers';

export const app = new Application({
    view: document.getElementById('pixi-canvas') as HTMLCanvasElement,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    backgroundColor: 0xFFFFFF,
    width: window.innerWidth,
    height: window.innerHeight,
});

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

for (let i = 0; i < 100; i++)
{
    const position = new Point(MathUtils.getRandom(70, app.view.width - 70), MathUtils.getRandom(70, app.view.height - 70));
    const velocity = new Point((Math.random() * 6) - 3, (Math.random() * 6) - 3);
    const isStatic = MathUtils.randomBool(0.1);
    const lineStyle = {
        width: 1,
        color: isStatic ? 'red' : 'black',
    };

    const c = new CircleBody({
        position,
        // velocity,
        radius: (Math.random() * 30) + 5,
        color: Math.random() * 16777215,
        lineStyle,
        // isStatic,
        mass: 1,
        bounciness: 0.1,
    });

    c.layer = 'balls';
    c.addForce(new Point(0, 0.2), false);
}

// new CapsuleBody(200, 100, {
//     position: new Point(100, 300),
//     lineStyle: {
//         width: 1,
//         color: "black",
//     }
// })

for (let i = 0; i < 50; i++)
{
    const position = new Point(MathUtils.getRandom(70, app.view.width - 70), MathUtils.getRandom(70, app.view.height - 70));
    const velocity = new Point((Math.random() * 6) - 3, (Math.random() * 6) - 3);
    const isStatic = MathUtils.randomBool(0.1);
    const lineStyle = {
        width: 1,
        color: isStatic ? 'red' : 'black',
    };

    const p = new PolygonBody(vertices, {
        position,
        velocity,
        color: Math.random() * 16777215,
        lineStyle,
        mass: 1,
        bounciness: 0.1,
        // isStatic,
    });

    p.layer = 2;
    p.addForce(new Point(0, 0.2), false);
    // p.angularVelocity = 0.05;
}

// const c = new PolygonBody(vertices2, {
//     position: new Point(500, 500),
//     lineStyle: {
//         width: 1,
//         color: 0xFFFFFF,
//     },
//     color: 0xAAAAAA,
// });
const c2 = new PolygonBody(vertices, {
    position: new Point(-100, -100),
    scale: new Point(1, 1),
    lineStyle: {
        width: 1,
        color: '0x40EE40',
    },
    color: '0x000000',
    mass: 1,
});

new ScreenContainer();

const platform1 = new PolygonBody(platformVertices, {
    position: new Point(300, 200),
    isStatic: true,
    color: 'black',
    rotation: Math.PI / 6,
    scale: new Point(4, 1),
});

const platform2 = new PolygonBody(platformVertices, {
    position: new Point(1000, 500),
    isStatic: true,
    color: 'black',
    rotation: -Math.PI / 6,
    scale: new Point(4, 1),
});

// c2.onCollisionEnter = (c) => console.log(c);
// c2.onCollisionStay = () => console.log('stayed');
// c2.onCollisionExit = () => console.log('exited');

Debug.initialize();
Debug.color = 0xFF0000;
InputSystem.initialize();

function updateLoop(deltaTime : number)
{
    Debug.reset();
    moveBodyWithInputs(deltaTime, c2, true);
    Physics.step(deltaTime, 8);
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

Ticker.shared.add(updateLoop);
// c2.sprite.texture = Texture.from('https://i.redd.it/a4b52sajjyr21.png');
c2.sprite.width = 100;
c2.sprite.height = 100;
c2.sprite.anchor.set(0.5, 0.5);
c2.sortableChildren = true;
c2.graphics.zIndex = 2;
c2.sprite.zIndex = 1;
