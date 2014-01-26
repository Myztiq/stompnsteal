ig.module(
  'game.entities.ring'
)
.requires(
  'impact.entity',
  'impact.entity-pool'
)
.defines(function(){

EntityRing = ig.Entity.extend({

  size: {x: 16, y: 16},
  gravityFactor: 0,
  animSheet: new ig.AnimationSheet( 'media/ring.png', 16, 16 ),
  lifeSpan: 2, // seconds
  lifeSpanTimer: null,
  player: null,
  sfxPhone: new ig.Sound( 'media/sounds/phone/ring.ogg' ),

  init: function( x, y, settings ) {
    this.parent( x, y, settings );
    this.addAnim( 'idle', 0.1, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] );

    this.reset(x,y,settings)
  },

  reset: function( x, y, settings ) {
    this.parent( x, y, settings );
    this.lifeSpanTimer = new ig.Timer( this.lifeSpan );
    this.player = settings.player;

    this.sfxPhone.play();
  },

  update: function() {
    this.parent();

    var delta = this.lifeSpanTimer.delta();
    if (delta >= 0) {
      this.kill();
    }

    this.currentAnim = this.anims.idle;

    this.flip = this.player.flip;
    this.currentAnim.flip.x = this.flip;

    var xOffset = this.flip ? -10 : 26;
    this.pos.x = this.player.pos.x + xOffset;
    this.pos.y = this.player.pos.y - 13;
  },

  handleMovementTrace: function( res ) {
    this.parent( res );
  }
});

ig.EntityPool.enableFor( EntityRing );

});
