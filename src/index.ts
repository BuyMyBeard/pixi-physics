import { Application, Ticker, Point } from 'pixi.js';
import { PolygonBody } from './PolygonBody';
import { MathUtils } from './MathUtils';
import { Body } from './Body';
import { Physics } from './Physics';
import { InputSystem } from './InputSystem';
import { ScreenContainer } from './ScreenContainer';
import { Debug } from './Debug';

export const app = new Application({
    view: document.getElementById('pixi-canvas') as HTMLCanvasElement,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    backgroundColor: 0xFFFFFF,
    width: window.innerWidth,
    height: window.innerHeight,
});

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

// for (let i = 0; i < 100; i++)
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
//     });

//     //c.addForce(new Point(0, 0.1), false);
// }

for (let i = 0; i < 10; i++)
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
        // velocity,
        color: Math.random() * 16777215,
        lineStyle,
        // isStatic,
    });
}
// p.addForce(new Point(0, -0.1), false);
// p.scale.set(Math.random() * 0.5 + 0.25)
// }
// new Circle({
// 	position: new Point(1000, 200),
// 	velocity: new Point(2, 2),
// });

// new Circle({
// 	position: new Point(1001, 201),
// 	velocity: new Point(-3, 4),
// 	color: 0xAAAA00,
// });
// new Circle({
// 	position: new Point(1002, 202),
// 	velocity: new Point(3, -3),
// 	color: 0x00AAAA,
// });
// new ScreenBorder(window.innerWidth, window.innerHeight, {bounciness : 1});

// new Circle({position: new Point(1000, 500), radius: 50, mass: 1000})

// const p = new Polygon(vertices);
// console.log(p.transform);
// p.rotation = 90;
// console.log(p.transform);
// const p2 = new Polygon(vertices2);

// const c = new PolygonBody(vertices2, {
//     position: new Point(500, 500),
//     lineStyle: {
//         width: 1,
//         color: 0xFFFFFF,
//     },
//     color: 0xAAAAAA,
// });
const c2 = new PolygonBody(vertices, {
    position: new Point(100, 100),
    scale: new Point(1, 1),
    lineStyle: {
        width: 1,
        color: '0x40EE40',
    },
    color: '0x000000'
});

new ScreenContainer();


// c2.onCollisionEnter = (c) => console.log(c);
// c2.onCollisionStay = () => console.log('stayed');
// c2.onCollisionExit = () => console.log('exited');

Debug.initialize();
Debug.color = 0xFF0000;
InputSystem.initialize();

function updateLoop(deltaTime : number)
{
    Debug.reset();
    moveBodyWithInputs(deltaTime, c2);
    Physics.step(deltaTime, 8);
    // c.transform.scale.set(c.transform.scale.x + deltaTime * 0.01, 1)
    // c2.rotation += deltaTime * 0.01;
    // const x = c2.localTransform.apply(new Point(2, 0));

    // c2.position.set(x.x, x.y);
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
