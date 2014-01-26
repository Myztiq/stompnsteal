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
  //gravityFactor: 0,
  animSheet: new ig.AnimationSheet( 'media/dollabill.png', 16, 16 ),
  lifeSpan: 1, // seconds
  lifeSpanTimer: null,

  init: function( x, y, settings ) {
    this.parent( x, y, settings );
    this.addAnim( 'idle', 0.15, [0, 1, 2, 3, 4, 5, 6] );
    this.reset(x,y,settings)
  },

  reset: function( x, y, settings ) {
    this.parent( x, y, settings );
    this.lifeSpanTimer = new ig.Timer( this.lifeSpan );

    this.vel.x = randomInt(0, 401) - 200;
    this.vel.y = randomInt(50, 100);
  },

  update: function() {
    this.parent();

    var delta = this.lifeSpanTimer.delta();
    if (delta >= 0) {
      this.kill();
    }

    this.currentAnim = this.anims.idle;
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

});
