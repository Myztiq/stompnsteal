ig.module(
  'game.entities.player'
)
.requires(
  'impact.entity',
  'game.entities.dollabill',
  'game.entities.cashmonies'
)
.defines(function(){

EntityPlayer = ig.Entity.extend({

  // The players (collision) size is a bit smaller than the animation
  // frames, so we have to move the collision box a bit (offset)
  size: {x: 14, y: 30},
  offset: {x: 7, y: 2},

  maxVel: {x: 160, y: 700},
  friction: {x: 800, y: 0},

  type: ig.Entity.TYPE.A, // Player friendly group
  checkAgainst: ig.Entity.TYPE.NONE,
  collides: ig.Entity.COLLIDES.ACTIVE,
  bankrupted: false,
  bankrupter: false,
  bankruptTimer: new ig.Timer(),

  animSheet: new ig.AnimationSheet( 'media/player.png', 32, 32 ),

  sfxHurt: [new ig.Sound( 'media/sounds/stomp/stomp1.ogg' ),
    new ig.Sound( 'media/sounds/stomp/stomp2.ogg' ),
    new ig.Sound( 'media/sounds/stomp/stomp3.ogg' )],

  sfxJumps: [new ig.Sound( 'media/sounds/jump-sounds/Jump1.ogg' ),
             new ig.Sound( 'media/sounds/jump-sounds/Jump2.ogg' ),
             new ig.Sound( 'media/sounds/jump-sounds/Jump3.ogg' )],
  sfxCashRegister: new ig.Sound( 'media/sounds/cash-register/CashRegister.ogg' ),

  health: 3,

  // These are our own properties. They are not defined in the base
  // ig.Entity class. We just use them internally for the Player
  gameType: 'player',
  flip: false,
  accelGround: 1500,
  accelAir: 900,
  jump: 450,
  maxHealth: 3,

  coins: 100,

  isStunned: false,
  stunTimer: null,

  TAKE_COINS_PER_HIT: 10,
  LOSE_COINS_PER_SELF_HIT: 10,

  init: function( x, y, settings ) {

    this.parent( x, y, settings );

    // Add the animations
    //Determine the offset depending on player number

    var idle = [0];
    var run = [0,1,2,3,4,5,6,7,8];
    var jump = [21];
    var fall = [22,23,24,25];
    var squish = [18,19,20];
    var squishOut = [20, 19, 18]

    var processOffest = function(offset, array){
      var itemsInRow = 18;
      for(var i=0;i<array.length;i++){
        array[i] = array[i] + (offset-1) * itemsInRow * 3;
      }
    }

    processOffest(this.controller, run);
    processOffest(this.controller, jump);
    processOffest(this.controller, fall);
    processOffest(this.controller, squish);
    processOffest(this.controller, idle);
    processOffest(this.controller, squishOut);

    this.addAnim( 'idle', 1, idle );
    this.addAnim( 'run', 0.07, run );
    this.addAnim( 'jump', 0.7, jump, true );
    this.addAnim( 'fall', 0.04, fall, true );
    this.addAnim( 'pain', 0.03, squish, true );
    this.addAnim( 'painOut', 0.03, squishOut, true );

    // Set a reference to the player on the game instance
    ig.game.player = this;
  },


  update: function() {
    var delta = this.bankruptTimer.delta();
    if ( delta >= 0 ) {
      this.bankrupted = false;
      this.bankrupter = false;
    }


    if ( this.isStunned ) {
      var delta = this.stunTimer.delta();
      if ( delta > -.2 ) {
        this.currentAnim = this.anims.painOut;
      }
      if ( delta >= 0 ) {
        this.isStunned = false;
      }

      this.parent();
      return;
    }

    if(!this.active){
      this.currentAnim.alpha = .1;
      this.parent()
      return;
    }else{
      this.currentAnim.alpha = 1;
    }

    // Handle user input; move left or right
    var accel = this.standing ? this.accelGround : this.accelAir;
    if( ig.input.state('left'+this.controller) ) {
      this.accel.x = -accel;
      this.flip = true;
    }
    else if( ig.input.state('right'+this.controller) ) {
      this.accel.x = accel;
      this.flip = false;
    }
    else {
      this.accel.x = 0;
    }

    // jump

    if( this.standing && ig.input.pressed('jump'+this.controller) ) {
      if (this.vel.y == 0){
        this.vel.y = -this.jump;
        this.falling = false;
        var element = randomElement(this.sfxJumps);
        element.getSound().setVolume(10);
        element.play();
      }
    }else
    // we're not standing, jump has been released and we're not falling
    // we reduce the y velocity by 66% and mark us as falling
    if(!this.standing && !ig.input.state('jump'+this.controller) && !this.falling) {
      this.vel.y = Math.floor(this.vel.y/3);
      this.falling = true;
    }

    if( this.vel.y < 0 ) {
      if(this.currentAnim != this.anims.jump){
        this.anims.jump.rewind();
      }
      this.currentAnim = this.anims.jump;
    }else if( this.vel.y > 0 ) {
      if(this.currentAnim != this.anims.fall){
        this.anims.fall.rewind();
      }
      this.currentAnim = this.anims.fall;
    }else if( this.vel.x != 0 ) {
      this.currentAnim = this.anims.run;
    }else {
      this.currentAnim = this.anims.idle;
    }

    this.currentAnim.flip.x = this.flip;


    // Move!
    this.parent();
  },

  takeCoinsFrom: function(other) {
    other.coins -= this.TAKE_COINS_PER_HIT;
    this.coins += this.TAKE_COINS_PER_HIT;

    if(other.coins == 0){
      other.bankrupted = true
      other.bankruptTimer = new ig.Timer( 5 );
      this.bankrupter = true
      this.bankruptTimer = new ig.Timer( 5 );
    }
  },

  loseCoins: function(other) {
    this.coins -= this.LOSE_COINS_PER_SELF_HIT;
  },

  collideWith: function( other, axis ) {
    // If you collide with an enemy from above, you stun them
    if ( axis == 'y' && this.last.y < other.pos.y ) {

      if(other.gameType === 'blob' && !other.isStunned) {
        if(other.allegiance === this.controller) {
          // oh no! got it when your own!
          this.loseCoins(other);
        } else {

          var entities = ig.game.getEntitiesByType('EntityPlayer');
          for(var j=0;j<entities.length;j++){
            var entity = entities[j]
            if(entity.controller == other.allegiance){

              // If they have no money there is no point to hit them!
              if(entity.coins != 0){
                // is another allegiance
                this.takeCoinsFrom(entity);

                if(entity.coins == 0){
                  this.sfxCashRegister.getSound().setVolume(30)
                  this.sfxCashRegister.play()
                }
              }
              break;
            }
          }
        }

        // Force push!
        var players = ig.game.getEntitiesByType('EntityPlayer');
        players.forEach(function(player) {
          var xDirection = 1;
          if (player.pos.x < other.pos.x) {
            xDirection = -1;
          }
          var distance = Math.sqrt(Math.pow(player.pos.x - other.pos.x, 2) + Math.pow(player.pos.y - other.pos.y, 2));
          if (distance < 100) {
            player.vel.x = xDirection * (600 - distance);
            player.vel.y = -200;
          }

        });

        ig.game.spawnEntity(EntityDollabill, this.pos.x + 1, this.pos.y - 18, {player: this} );

        for (var i = 0; i < 20; i++) {
          ig.game.spawnEntity(EntityCashmonies, this.pos.x, this.pos.y, {} );
        }
      }
      else {
        // Bounce off enemy
        this.vel.y = -this.jump;
        if ( this.vel.x > 0 ) {
          this.vel.x = 350;
        }
        else if ( this.vel.x < 0 ) {
          this.vel.x = -350;
        }
        else {
          this.vel.x = randomPositiveOrNegative() * 350;
        }
      }

      other.stun( 1 );
    }
    else if ( axis == 'x' ) {
      if ( this.last.x < other.pos.x ) {
        this.vel.x = -100;
      }
      else if ( this.last.x > other.pos.x ) {
        this.vel.x = 100;
      }
    }
  },

  stun: function( duration ) {
    this.isStunned = true;
    this.stunTimer = new ig.Timer( duration );

    // Zero out x velocity
    this.accel.x = 0;
    this.vel.x = 0;

    // Pain animation
    this.currentAnim = this.anims.pain.rewind();

    // Sound

    var element = randomElement(this.sfxHurt);
    element.getSound().setVolume(20);
    element.play();
  }
});

// Utility functions
function randomElement( myArray ) {
    var item = myArray[Math.floor(Math.random()*myArray.length)];
    return item;
}

function randomPositiveOrNegative() {
    return Math.random() - 0.5 > 0 ? 1 : -1;
}
});
