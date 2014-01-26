ig.module(
  'game.entities.dollabill'
)
.requires(
  'impact.entity',
  'impact.entity-pool'
)
.defines(function(){

EntityDollabill = ig.Entity.extend({

  size: {x: 16, y: 16},
  gravityFactor: 0,
  animSheet: new ig.AnimationSheet( 'media/dollabill.png', 16, 16 ),
  lifeSpan: 1, // seconds
  lifeSpanTimer: null,
  player: null,
  sfxCoins: [new ig.Sound( 'media/sounds/coin/coin1.ogg' ),
    new ig.Sound( 'media/sounds/coin/coin2.ogg' ),
    new ig.Sound( 'media/sounds/coin/coin3.ogg' ),
    new ig.Sound( 'media/sounds/coin/coin4.ogg' )
  ],

  init: function( x, y, settings ) {
    this.parent( x, y, settings );
    this.addAnim( 'idle', 0.15, [0, 1, 2, 3, 4, 5, 6] );
    this.lifeSpanTimer = new ig.Timer( this.lifeSpan );
    this.player = settings.player;

    this.reset(x,y,settings)

  },

  reset: function( x, y, settings ) {
    this.parent( x, y, settings );
    this.lifeSpanTimer = new ig.Timer( this.lifeSpan );
    this.player = settings.player;

    var that = this;
    for(var i=0;i<20;i++){
      setTimeout(function(){
        var element = randomElement(that.sfxCoins);
        element.getSound().setVolume(20);
        element.play();
      }, Math.random()*300);
    }
  },

  update: function() {
    this.parent();

    var delta = this.lifeSpanTimer.delta();
    if (delta >= 0) {
      this.kill();
    }

    this.currentAnim = this.anims.idle;

    this.pos.x = this.player.pos.x + 1;
    this.pos.y = this.player.pos.y - 18;
  },

  handleMovementTrace: function( res ) {
    this.parent( res );
  }
});

ig.EntityPool.enableFor( EntityDollabill );


// Utility functions
function randomElement( myArray ) {
  var item = myArray[Math.floor(Math.random()*myArray.length)];
  return item;
}

});
