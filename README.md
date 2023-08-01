# 2d collision system
This system is heavily inspired by the implementation proposed in this video: 
[Building Collision Simulations: An Introduction to Computer Graphics](https://youtu.be/eED4bSkYCB8)

I optimized the collision detection by using a Sweep And Prune algorithm, and wrote the entire thing in Typescript using the Pixi.js rendering system. 
I also added a bounciness coefficient, multiple collision response for when 2 collisions with the same object happens on the same frame, and particles 
push-away to avoid 2 particles stay stuck inside each other.

Id like to go in more depth for the implementation, but dipping my toes in this has shown me how deep the rabbit hole goes. Fun times.
