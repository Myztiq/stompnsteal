ig.module(
  'game.entities.blob'
)
.requires(
  'impact.entity'
)
.defines(function(){

EntityBlob = ig.Entity.extend({
  size: {x: 16, y: 40},
  offset: {x: 8, y: 8},
  maxVel: {x: 160, y: 700},
  friction: {x: 800, y: 0},

  type: ig.Entity.TYPE.B, // Evil enemy group
  checkAgainst: ig.Entity.TYPE.A, // Check against friendly
  collides: ig.Entity.COLLIDES.PASSIVE,

  health: 1,

  jump: 450,
  jumpSpeed: 200,
  speed: 60,
  flip: false,

  animSheet: new ig.AnimationSheet( 'media/Boss_Sheet.png', 48, 48 ),
  sfxRing: new ig.Sound( 'media/sounds/phone/ring.ogg' ),

  isStunned: false,
  stunTimer: null,

  allegiance: 1,

  coins: 0,
  gameType: 'blob',

  init: function( x, y, settings ) {
    this.parent( x, y, settings );

    this.coins = 100;

    var idleRaw = [0];
    var runRaw = [0,1,2,3,4,5,6,7,8];
    var jumpRaw = [12];
    var fallRaw = [13,14,15,16];

    var squishRaw = [9,10,11];
    var squishOutRaw = [11, 10, 9];


    var processOffest = function(offset, source, target){
      var itemsInRow = 9;
      for(var i=0;i<source.length;i++){
        target[i] = source[i] + (offset-1) * itemsInRow * 3 + itemsInRow * 3;
      }
    }

    for(var i=1;i<5;i++){
      var run = [];
      var jump = [];
      var fall = [];
      var squish = [];
      var idle =[];
      var squishOut = []
      processOffest(i, runRaw, run);
      processOffest(i, jumpRaw, jump);
      processOffest(i, fallRaw, fall);
      processOffest(i, squishRaw, squish);
      processOffest(i, idleRaw, idle);
      processOffest(i, squishOutRaw, squishOut);

      this.addAnim('idle'+i, 1, idle );
      this.addAnim('run'+i, 0.07, run );
      this.addAnim('jump'+i, 0.7, jump, true );
      this.addAnim('fall'+i, 0.04, fall, true );
      this.addAnim('pain'+i, 0.03, squish, true );
      this.addAnim('painOut'+i, 0.03, squishOut, true );
    }
  },


  update: function() {
    if ( this.isStunned ) {
      var delta = this.stunTimer.delta();
      if ( delta > -.2 ) {
        this.currentAnim = this.anims['painOut' + this.allegiance];
      }
      if ( delta >= 0 ) {
        this.isStunned = false;
      }

      this.parent();
      return;
    }

    // Near an edge? return!
    if( !ig.game.collisionMap.getTile(
        this.pos.x + (this.flip ? +1 : this.size.x -1),
        this.pos.y + this.size.y+1
      )
    ) {
      if(this.standing && this.vel.y == 0){
        if(Math.random() < .3){
          var xdir = this.flip ? -1 : 1;
          this.vel.y = -this.jump;
          this.accel.x = this.jumpSpeed * xdir;
          this.vel.x = this.speed * 2 * xdir ;
        }else{
          this.flip = !this.flip;
          var xdir = this.flip ? -1 : 1;
          this.vel.x = this.speed * xdir;
        }
      }
    }else if(this.standing){
      var xdir = this.flip ? -1 : 1;
      this.vel.x = this.speed * xdir;
    }else{
      this.accel.x = this.jumpSpeed * xdir;
    }

    if(this.standing && Math.random() < .01){
      this.vel.y = -this.jump;
      this.accel.x = this.jumpSpeed * xdir;
      this.vel.x = this.speed * 2 * xdir ;
    }

    if(this.currentAnim){
      this.currentAnim.flip.x = this.flip;
    }


    if( this.vel.y < 0 ) {
      if(this.currentAnim != this.anims['jump' + this.allegiance]){
        this.anims['jump' + this.allegiance].rewind()
      }
      this.currentAnim = this.anims['jump' + this.allegiance];
    }else if( this.vel.y > 0 ) {
      if(this.currentAnim != this.anims['fall' + this.allegiance]){
        this.anims['fall' + this.allegiance].rewind();
      }
      this.currentAnim = this.anims['fall' + this.allegiance];

    }else if( this.vel.x != 0 ) {
      this.currentAnim = this.anims['run' + this.allegiance];
    }else {
      this.currentAnim = this.anims['idle' + this.allegiance];
    }

    this.parent();
  },

  kill: function() {
    this.sfxDie.play();
    this.parent();

  },

  handleMovementTrace: function( res ) {
    this.parent( res );

    // Collision with a wall? return!
    if( res.collision.x && this.standing) {
      this.flip = !this.flip;
    }
  },

  check: function( other ) {
    //other.receiveDamage( 1, this );
  },

  stun: function( duration ) {
    if(this.isStunned){
      return;
    }
    this.isStunned = true;
    this.stunTimer = new ig.Timer( duration );

    this.currentAnim = this.anims['pain' + this.allegiance].rewind();

    // Zero out x velocity
    this.accel.x = 0;
    this.vel.x = 0;
  },

  changeAllegiance: function( player ) {
    this.allegiance = player;

    this.sfxRing.getSound().setVolume(5 );
    this.sfxRing.play();

  }
});

});
