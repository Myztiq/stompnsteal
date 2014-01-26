ig.module(
  'plugins.camera'
)
.defines(function(){ "use strict";

ig.Camera = ig.Class.extend({

  vel: {x: 0, y: 0, z: 0},
  accel: {x: 0, y: 0, z: 0},
  friction: {x: 800, y: 800, z: 800},
  maxVel: {x: 200, y: 200, z:.8},
  threshold: {
    x: 10,
    y: 10,
    z:.01
  },

  init: function() {
    var canvas = document.getElementById('canvas');
    this.context = canvas.getContext('2d');
    this.defaultWidth = ig.system.width;
    this.defaultHeight = ig.system.height;

    this.scale = 1;

    this.maxScale = 4;
    this.minScale = .5;
    this.padding = 100;
    this.mapWidth = ig.game.collisionMap.width * ig.game.collisionMap.tilesize;
    this.mapHeight = ig.game.collisionMap.height * ig.game.collisionMap.tilesize;
  },
  
  follow: function( entityArray ) {
    this.tracking = entityArray;
  },

  preDraw: function(){
    var oldScale = this.scale;
    ig.system.context.save();

    var bounds = {
      minX: this.tracking[0].pos.x,
      minY: this.tracking[0].pos.y,
      maxX: this.tracking[0].pos.x,
      maxY: this.tracking[0].pos.y
    }

    for(var i=0;i<this.tracking.length;i++){
      var entity = this.tracking[i];
      if(entity.pos.x > bounds.maxX){
        bounds.maxX = entity.pos.x
      }
      if(entity.pos.y > bounds.maxY){
        bounds.maxY = entity.pos.y
      }
      if(entity.pos.x < bounds.minX){
        bounds.minX = entity.pos.x
      }
      if(entity.pos.y < bounds.minY){
        bounds.minY = entity.pos.y
      }
    }

    //Okay, we have the bounds, get the size of it!

    var newWidth = bounds.maxX - bounds.minX + this.padding;
    var newHeight = bounds.maxY - bounds.minY + this.padding;


    var scaleWidth = this.defaultWidth / newWidth;
    var scaleHeight = this.defaultHeight / newHeight;

    var desiredScale = 0
    if(scaleWidth < scaleHeight){
      desiredScale = scaleWidth;
    }else{
      desiredScale = scaleHeight;
    }

    if(desiredScale < this.minScale){
      desiredScale = this.minScale;
    }
    if(desiredScale > this.maxScale){
      desiredScale = this.maxScale;
    }

    if(oldScale - desiredScale > this.threshold.z){
      this.accel.z = -1;
    }else if(desiredScale - oldScale > this.threshold.z){
      this.accel.z = 1;
    }else{
      this.accel.z = 0;
    }


    //Center the camera!
    var newCenter = {
      x: bounds.minX - this.padding/2,
      y: bounds.minY - this.padding/2
    }


    var movePower = 3000;

    if(newCenter.y - ig.game.screen.y > this.threshold.y){
      this.accel.y = movePower;
    }else if(ig.game.screen.y - newCenter.y > this.threshold.y){
      this.accel.y = -movePower;
    }else{
      this.accel.y = 0;
    }

    if(newCenter.x - ig.game.screen.x > this.threshold.x){
      this.accel.x = movePower;
    }else if(ig.game.screen.x - newCenter.x > this.threshold.x){
      this.accel.x = -movePower;
    }else{
      this.accel.x = 0;
    }

    this.vel.x = this.getNewVelocity( this.vel.x, this.accel.x, this.friction.x, this.maxVel.x );
    this.vel.y = this.getNewVelocity( this.vel.y, this.accel.y, this.friction.y, this.maxVel.y );
    this.vel.z = this.getNewVelocity( this.vel.z, this.accel.z, this.friction.z, this.maxVel.z );

    var mx = this.vel.x * ig.system.tick;
    var my = this.vel.y * ig.system.tick;
    var mz = this.vel.z * ig.system.tick;


    ig.game.screen.x += mx;
    ig.game.screen.y += my;

    if(ig.game.screen.x < 0){
      ig.game.screen.x = 0;
    }
    if(ig.game.screen.y < 0){
      ig.game.screen.y = 0;
    }


    var scaledWidth = this.defaultWidth / (this.scale + mz)
    var scaledHeight = this.defaultHeight / (this.scale + mz)
    if(scaledWidth < this.mapWidth && scaledHeight < this.mapHeight){
      this.scale += mz;
    }


    if(scaledWidth + ig.game.screen.x > this.mapWidth){
      ig.game.screen.x = this.mapWidth - scaledWidth;
    }
    if(scaledHeight + ig.game.screen.y > this.mapHeight){
      ig.game.screen.y = this.mapHeight - scaledHeight;
    }

    ig.system.context.scale( this.scale, this.scale );

  },

  getNewVelocity: function( vel, accel, friction, max ) {
    if( accel ) {
      return ( vel + accel * ig.system.tick ).limit( -max, max );
    }
    else if( friction ) {
      var delta = friction * ig.system.tick;

      if( vel - delta > 0) {
        return vel - delta;
      }
      else if( vel + delta < 0 ) {
        return vel + delta;
      }
      else {
        return 0;
      }
    }
    return vel.limit( -max, max );
  },

  draw: function(){
    ig.system.context.restore();
    ig.system.width = this.defaultWidth / this.scale;
    ig.system.height = this.defaultHeight / this.scale;
  }
});

});