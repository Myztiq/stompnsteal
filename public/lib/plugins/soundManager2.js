ig.module(
  'plugins.soundManager2'
)
.requires(
  'impact.sound'
).
defines(function() {
  ig.Sound.inject({
    load: function(loadCallback){
      var self = this;
      soundManager.onready(function() {
        self.soundId = Math.random();
        self.soundManagerSound = soundManager.createSound({
          id: self.soundId,
          url:self.path
        });
        self.soundManagerSound.load();
      });
    },
    play: function(){
      if(this.soundManagerSound){
        this.soundManagerSound.play();
      }
    },
    stop: function(){
      if(this.soundManagerSound){
        this.soundManagerSound.stop();
      }
    },
    getSound: function(){
      if(this.soundManagerSound){
        return this.soundManagerSound;
      }else{
        return {setVolume:function(){}};
      }
    }
  });
});