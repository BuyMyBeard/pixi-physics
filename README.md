# pixi-physics

## Physics engine plugin tailored for PixiJS

I've taken an interest in 2d physics engines after working on multiple Unity 2d platformers, so I decided to make my own physics engine! I already have a sweet spot for Pixijs as a rendering engine, since I made my first few jam games with it. At heart, it's not a framework, so I wanted to contribute to it by making a plugin that works seemlessly and does all you want a 2d physics engine to do.

I know a few integrations of pre-existing 2d physics engines have already been done with PixiJS, like Matterjs and Box2D, but I don't like the idea of having to sync the renderer and the physics simulation. Making the physics use PixiJS's DisplayObject transform is a lot more intuitive overall, and avoids problems where the 2 are out of sync, while also probably being faster and more memory efficient (don't quote me, I didn't benchmark it). 

There are also a few things I'm unhappy about, like those engines not being maintained and [Matter.js's circles not being real circles](https://github.com/liabru/matter-js/blob/ce03208c5f597d4a5bceaf133cc959c428dd5147/src/factory/Bodies.js#L126C12-L126C24), but overall it's mainly just an excuse to program something myself for funsies.

### Video examples of physics engine in action

#### Rotational physics and friction in action

[Rotational physics and friction in action](https://github.com/BuyMyBeard/pixi-physics/assets/95039323/3f136a9b-0e23-4172-bf64-a8e5b4228d56)

#### 1000 particle simulation with perfectly elastic collisions

[1000 particle simulation with perfectly elastic collisions](https://github.com/BuyMyBeard/pixi-physics/assets/95039323/1c833928-89ba-4e6a-9651-7207550eafb5)

### Backlog

- Stacking stability tuning M
- Raycast M
- Documentation M
- Layer system S
- Body Factory S
- Capsule bodies S
- Concave polygons C
- Joints C
- Soft Bodies W
- Ellipse Bodies W

### Done

- Circle bodies
- Broad phase (Sweep and Prune)
- Polygon bodies
- Collision detection
- Collision response
- Collision resolution
- Forces and impulses
- Friction
- Bounciness
- onCollisionEnter, onCollisionStay, onCollisionExit events
- Static bodies
- lockX, lockY, lockRotation
