ig.module(
  'game.entities.cashmonies'
)
.requires(
  'impact.entity',
  'impact.entity-pool'
)
.defines(function(){

EntityCashmonies = ig.Entity.extend({

  size: {x: 16, y: 16},
  gravityFactor: 0.1,
  animSheet: new ig.AnimationSheet( 'media/cashmonies.png', 16, 16 ),
  lifeSpan: 2, // seconds
  lifeSpanTimer: null,
  maxVel: {x: 200, y: 200},

  init: function( x, y, settings ) {
    this.parent( x, y, settings );
    this.addAnim( 'anim1', 0.1, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] );
    this.addAnim( 'anim2', 0.1, [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27] );
    this.reset(x,y,settings)
  },

  reset: function( x, y, settings ) {
    this.parent( x, y, settings );
    this.lifeSpanTimer = new ig.Timer( this.lifeSpan );

    this.vel.x = randomInt(0, 101) - 50;
    this.vel.y = randomInt(50, 81) * -1;
  },

  update: function() {
    this.parent();

    var delta = this.lifeSpanTimer.delta();
    if (delta >= 0) {
      this.kill();
    }

    this.currentAnim = this.anims[randomElement(['anim1', 'anim2'])];
  },

  handleMovementTrace: function( res ) {
    this.parent( res );
  },
});

ig.EntityPool.enableFor( EntityCashmonies );

// Utility functions
function randomInt(lowerBound, upperBound) {
  return lowerBound + Math.floor(Math.random()*upperBound);
}

function randomElement( myArray ) {
  var item = myArray[Math.floor(Math.random()*myArray.length)];
  return item;
}

});
