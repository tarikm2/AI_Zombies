
// find and replace tam with your initials (i.e. ABC)
// change this.name = "Your Chosen Name"

// only change code in selectAction function()

function tam(game) {
    this.player = 1;
    this.radius = 10;
    this.rocks = 0;
    this.kills = 0;
    this.name = "DEBUG_TEST_V5";
    this.color = "White";
    this.cooldown = 0;
    Entity.call(this, game, this.radius + Math.random() * (800 - this.radius * 2), this.radius + Math.random() * (800 - this.radius * 2));

    this.velocity = { x: 0, y: 0 };
};

tam.prototype = new Entity();
tam.prototype.constructor = tam;

// alter the code in this function to create your agent
// you may check the state but do not change the state of these variables:
//    this.rocks
//    this.cooldown
//    this.x
//    this.y
//    this.velocity
//    this.game and any of its properties

// you may access a list of zombies from this.game.zombies
// you may access a list of rocks from this.game.rocks
// you may access a list of players from this.game.players

tam.prototype.selectAction = function () {

    var action = { direction: { x: 0, y: 0 }, throwRock: false, target: null};
    var acceleration = 1000000;
    var closest = 1000;
    var target = null;
    this.visualRadius = 500;

    //for every zombie
    for (var i = 0; i < this.game.zombies.length; i++) {
        var ent = this.game.zombies[i];
        var dist = distance(ent, this);
        //find the closest zombie to us
        if (dist < closest) {
            closest = dist;
            target = ent;
        }
        //if this zombie is within our humans view radius
        if (this.collide({x: ent.x, y: ent.y, radius: this.visualRadius})) {
            //let the zombie have an inversely proportional effect in our next move to
            //its distance from us. we move away from zombies
            var difX = (ent.x - this.x) / dist;
            var difY = (ent.y - this.y) / dist;
            action.direction.x -= difX * acceleration / (dist * dist);
            action.direction.y -= difY * acceleration / (dist * dist);
        }
    }

    //for each rock
    for (var i = 0; i < this.game.rocks.length; i++) {
        var ent = this.game.rocks[i];
        //if this rock is free and within our visible radius
        if (!ent.removeFromWorld && !ent.thrown && this.rocks < 2 && this.collide({ x: ent.x, y: ent.y, radius: this.visualRadius })) {
            var dist = distance(this, ent);
            //and if this rock is not touching us.
            if (dist > this.radius + ent.radius) {
                //let this rock have an influence on our next move
                //inversely proportional to its distance from us. we move towardsd rocks
                var difX = (ent.x - this.x) / dist;
                var difY = (ent.y - this.y) / dist;
                action.direction.x += difX * acceleration / (dist * dist);
                action.direction.y += difY * acceleration / (dist * dist);
            }
        }
    }

    //throw the rock if we have a rock and target.
    if (target) {
        action.target = target;
        action.throwRock = true;
    }
    return action;
};

// do not change code beyond this point

tam.prototype.collide = function (other) {
    return distance(this, other) < this.radius + other.radius;
};

//test if the left size of this human is touching the wall.
tam.prototype.collideLeft = function () {
    return (this.x - this.radius) < 0;
};

//test if the right side of this human is touching the wall.
tam.prototype.collideRight = function () {
    return (this.x + this.radius) > 800;
};

//test if the top of this human is touching the wall.
tam.prototype.collideTop = function () {
    return (this.y - this.radius) < 0;
};

//test if the bottom of this human is touching the wall.
tam.prototype.collideBottom = function () {
    return (this.y + this.radius) > 800;
};

tam.prototype.update = function () {
    Entity.prototype.update.call(this);
    // console.log(this.velocity);

    /*
      Update our rock throwing cool down time.
     */
    if (this.cooldown > 0) this.cooldown -= this.game.clockTick;
    if (this.cooldown < 0) this.cooldown = 0;

    /*
      get our action with select action.
     */
    this.action = this.selectAction();
    //if (this.cooldown > 0) console.log(this.action);
    this.velocity.x += this.action.direction.x;
    this.velocity.y += this.action.direction.y;

    /*
    setour speed.
     */
    var speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
    if (speed > maxSpeed) {
        var ratio = maxSpeed / speed;
        this.velocity.x *= ratio;
        this.velocity.y *= ratio;
    }

    this.x += this.velocity.x * this.game.clockTick;
    this.y += this.velocity.y * this.game.clockTick;

    /*
       handle collisionis with the walls, floor, or ceiling.
       prevent moving into walls, set the distance to radius from
       wall.
     */
    if (this.collideLeft() || this.collideRight()) {
        this.velocity.x = -this.velocity.x * friction;
        if (this.collideLeft()) this.x = this.radius;
        if (this.collideRight()) this.x = 800 - this.radius;
        this.x += this.velocity.x * this.game.clockTick;
        this.y += this.velocity.y * this.game.clockTick;
    }

    if (this.collideTop() || this.collideBottom()) {
        this.velocity.y = -this.velocity.y * friction;
        if (this.collideTop()) this.y = this.radius;
        if (this.collideBottom()) this.y = 800 - this.radius;
        this.x += this.velocity.x * this.game.clockTick;
        this.y += this.velocity.y * this.game.clockTick;
    }

    /*
      HANDLE COLLSION WITH HUMANS
     */
    //for every rock, zombie, or human in this field
    for (var i = 0; i < this.game.entities.length; i++) {
        var ent = this.game.entities[i];
        if (ent !== this && this.collide(ent)) {
            //if it is a human, collide and change the movement
            if (ent.name !== "Zombie" && ent.name !== "Rock") {
                var temp = { x: this.velocity.x, y: this.velocity.y };
                var dist = distance(this, ent);
                var delta = this.radius + ent.radius - dist;
                var difX = (this.x - ent.x) / dist;
                var difY = (this.y - ent.y) / dist;

                this.x += difX * delta / 2;
                this.y += difY * delta / 2;
                ent.x -= difX * delta / 2;
                ent.y -= difY * delta / 2;

                this.velocity.x = ent.velocity.x * friction;
                this.velocity.y = ent.velocity.y * friction;
                ent.velocity.x = temp.x * friction;
                ent.velocity.y = temp.y * friction;
                this.x += this.velocity.x * this.game.clockTick;
                this.y += this.velocity.y * this.game.clockTick;
                ent.x += ent.velocity.x * this.game.clockTick;
                ent.y += ent.velocity.y * this.game.clockTick;
            }
            //if it is a rock and we can pick it up, pick it up
            if (ent.name === "Rock" && this.rocks < 2) {
                this.rocks++;
                ent.removeFromWorld = true;
            }
        }
    }

    /*
     ATTACK SEQUENCE
     if we have a rock and we can throw it. then throw it.
     */
    if (this.cooldown === 0 && this.action.throwRock && this.rocks > 0) {
        this.cooldown = 1;
        this.rocks--;
        var target = this.action.target;
        var dir = direction(target, this);

        var rock = new Rock(this.game);
        rock.x = this.x + dir.x * (this.radius + rock.radius + 20);
        rock.y = this.y + dir.y * (this.radius + rock.radius + 20);
        rock.velocity.x = dir.x * rock.maxSpeed;
        rock.velocity.y = dir.y * rock.maxSpeed;
        rock.thrown = true;
        rock.thrower = this;
        this.game.addEntity(rock);
    }

    this.velocity.x -= (1 - friction) * this.game.clockTick * this.velocity.x;
    this.velocity.y -= (1 - friction) * this.game.clockTick * this.velocity.y;
};

tam.prototype.draw = function (ctx) {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath();
};