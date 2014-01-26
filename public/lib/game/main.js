ig.module(
  'game.main'
)
.requires(
  'impact.game',
  'impact.font',

  'plugins.camera',
  'plugins.touch-button',
  'plugins.impact-splash-loader',
  'plugins.gamepad',

  'game.entities.player',
  'game.entities.blob',
  'game.entities.ring',

  'game.levels.title',
  'game.levels.groundzero_1',

  'plugins.soundManager2'
)
.defines(function(){


// Our Main Game class. This will load levels, host all entities and
// run the game.

window.gameWidth = 1280;
window.gameHeight = 736;

MyGame = ig.Game.extend({

  clearColor: "#d0f4f7",
  gravity: 1000, // All entities are affected by this

  // Load a font
  font: new ig.Font( 'media/fredoka-one.font.png' ),
  newFont: new ig.Font( 'media/NewPixel_Font.png' ),

  music: new ig.Sound( 'media/sounds/music.ogg' ),

  sfxWin: new ig.Sound( 'media/sounds/win/win.ogg' ),

  victoryMessage: '',
  winPlayed: false,

  gameTimer: null,
  gameLength: 180, // In seconds

  playerImages: new ig.Image( 'media/Portraits.png' ),

  freeAgent: null,
  colorChanges: [],
  colorChangeTimer: null,
  colorChangeNotificationTimer: null,

  init: function() {
    // We want the font's chars to slightly touch each other,
    // so set the letter spacing to -2px.
    this.font.letterSpacing = -2;

    this.loadLevel( LevelGroundzero_1 );

    this.music.play();


    ig.input.bind( ig.KEY.X, 'jump4' );
    ig.input.bind( ig.KEY.LEFT_ARROW, 'left4' );
    ig.input.bind( ig.KEY.RIGHT_ARROW, 'right4' );


    Gamepad.mappings.one = [
      [ 'dpadLeft', 'left1' ],
      [ 'dpadRight', 'right1' ],
      [ 'leftStickX', 'left1', 'right1' ],
      [ 'faceButton0', 'jump1' ],
      [ 'start', 'start' ]
    ];
    Gamepad.mappings.two = [
      [ 'dpadLeft', 'left2' ],
      [ 'dpadRight', 'right2' ],
      [ 'leftStickX', 'left2', 'right2' ],
      [ 'faceButton0', 'jump2' ],
      [ 'start', 'start' ]
    ];
    Gamepad.mappings.three = [
      [ 'dpadLeft', 'left3' ],
      [ 'dpadRight', 'right3' ],
      [ 'leftStickX', 'left3', 'right3' ],
      [ 'faceButton0', 'jump3' ],
      [ 'start', 'start' ]
    ];
    Gamepad.mappings.four = [
      [ 'dpadLeft', 'left4' ],
      [ 'dpadRight', 'right4' ],
      [ 'leftStickX', 'left4', 'right4' ],
      [ 'faceButton0', 'jump4' ],
      [ 'start', 'start' ]
    ];

    this.camera = new ig.Camera();


    var livingEntities = this.getEntitiesByType('EntityPlayer');
    this.camera.follow(livingEntities.concat(this.getEntitiesByType('EntityBlob')))
  },

  loadLevel: function( data ) {
    // Remember the currently loaded level, so we can reload when
    // the player dies.
    this.currentLevel = data;

    // Call the parent implemenation; this creates the background
    // maps and entities.
    this.parent( data );

    this.screen.x = 0;
    this.screen.y = 16*7;


    var entities = this.getEntitiesByType('EntityPlayer');

    for(var j=0;j<entities.length;j++){
      var entity = entities[j]
      if(!window.currentPlayerStatus[entity.controller]){
        entity.kill()
      }
    }


    var activePlayerCount = window.activePlayerCount;
    if (isNaN(window.activePlayerCount)) {
        activePlayerCount = 1;
    }

    // Compute the amount of time the free agent will spend allied with each
    // player
    var timePerPlayer = Math.floor(this.gameLength / activePlayerCount);

    // Create an object for keeping track of how much free agent time we've
    // allocated to each player
    var timePerPlayerMap = {};
    for(var i=0;i<activePlayerCount;i++){
      timePerPlayerMap[i] = timePerPlayer;
    }
    timePerPlayerMap.hasAllocatedAllTime = function() {
      for(var i=0;i<activePlayerCount;i++){
        if (timePerPlayerMap[i] > 0) {
          return false;
        }
      }
      return true;
    };

    // Assign random intervals of free agent time for each player, making sure
    // allot an equal amount of time to each player
    var colorChanges = [];
    while (!timePerPlayerMap.hasAllocatedAllTime()) {
      for(var i=0;i<activePlayerCount;i++){
        var randomTime = randomInt(3, 11);
        if (timePerPlayerMap[i] > 0) {
          randomTime = Math.min(randomTime, timePerPlayerMap[i]);
          timePerPlayerMap[i] -= randomTime;
          colorChanges.push({player: i, duration: randomTime});
        }
      }
    }

    // Randomize the order of the color changes
    shuffle(colorChanges);
    this.colorChanges = colorChanges;

    this.freeAgent = this.getEntitiesByType('EntityBlob')[0];

    this.gameTimer = new ig.Timer(this.gameLength);
  },

  update: function() {
    // Update all entities and BackgroundMaps
    Gamepad.handleInput();

    if ((!this.colorChangeTimer || this.colorChangeTimer.delta() >= 0) && this.colorChanges.length > 0) {
      var colorChange = this.colorChanges.shift();
      this.colorChangeTimer = new ig.Timer(colorChange.duration);
      if (colorChange.player != this.colorChanges[0].player) {
        this.colorChangeNotificationTimer = new ig.Timer(colorChange.duration - 2);
      }
      var player = this.getEntitiesByType('EntityPlayer')[colorChange.player];
      this.freeAgent.changeAllegiance(player.controller);
    }
    if (this.colorChangeNotificationTimer && this.colorChangeNotificationTimer.delta() >= 0) {
      ig.game.spawnEntity(EntityRing, this.freeAgent.pos.x + 13, this.freeAgent.pos.y - 13, {player: this.freeAgent} );
      this.colorChangeNotificationTimer = null;
    }

    // Only update entities if the game isn't over
    if (this.gameTimer.delta() < -1) {
      this.parent();
    }else {

      if(!this.winPlayed){
        this.winPlayed = true
        this.sfxWin.play()
      }
      this.camera.preDraw()
      this.draw()
      this.camera.draw()

      if(ig.input.pressed('jump4') || ig.input.pressed('start')){
        ig.system.setGame( MyTitle );
      }
    }
  },

  draw: function() {
    // Call the parent implementation to draw all Entities and BackgroundMaps
    this.camera.preDraw()
    this.parent();
    this.camera.draw()

    var scorePositions = [
      { //Player 1
        x: 5,
        y: 40,
        icon:{
          x: 5,
          y: 0
        }
      },
      { //Player 2
        x: 560,
        y: 40,
        icon:{
          x: 590,
          y: 0,
          flip: true
        }
      },
      { //Player 3
        x: 5,
        y: 330,
        icon:{
          x: 5,
          y: 290
        }
      },
      { //Player 4
        x: 560,
        y: 330,
        icon:{
          x: 590,
          y: 290,
          flip: true
        }
      }
    ]

    var players = this.getEntitiesByType('EntityPlayer').filter(function(e) {
      return e.active && e.gameType === 'player'; });

    var win = 0;
    var lose = 100;
    players.forEach(function(player, i) {
      if(player.coins > win){
        win = player.coins
      }
      if(player.coins < lose){
        lose = player.coins
      }
    })

    players.forEach(function(player) {
      var i = player.controller-1;
      var align = scorePositions[i].icon.flip ? ig.Font.ALIGN.RIGHT : ig.Font.ALIGN.LEFT;
      var xPosition = scorePositions[i].icon.flip ? scorePositions[i].x + 77 : scorePositions[i].x;
      this.newFont.draw('$'+player.coins+'L', xPosition, scorePositions[i].y, align);

      var tile = 0;
      if(win == lose){ //Everyone is tied!
        tile = 3;
      }else if(player.coins == win){
        tile = 1;
      }else if(player.coins == lose){
        tile = 4;
      }else{
        tile = 3;
      }

      if(player.bankrupted){
        tile = 0;
      }
      if(player.bankrupter){
        tile = 2;
      }

      this.playerImages.drawTile(scorePositions[i].icon.x, scorePositions[i].icon.y, tile + i * 5, 48, 48, scorePositions[i].icon.flip);
    }, this);

    this.font.draw( this.timeLeft(), 360, 10, ig.Font.ALIGN.RIGHT );

    // If the game is over, display victory message
    if (this.gameTimer.delta() >= -1) {
      var winners = [];
      var winningPlayers = []
      var maxCoins = 0;
      players.forEach(function(player, i) {
        if (player.coins > maxCoins) {
          winners = ['P' + (i+1)];
          winningPlayers = [player]
          maxCoins = player.coins;
        }
        else if (player.coins == maxCoins) {
          winners.push('P' + (i+1));
          winningPlayers.push(player)
        }
      });

      var message;
      if (winners.length == 1) {
        message = winners[0] + ' WINS';
      }
      else {
        message = winners.join(' AND ') + ' WIN'
      }

      this.victoryMessage = message;


      this.camera.follow(winningPlayers)
      this.camera.minScale = 0;
      this.camera.maxScale = 100;
    }
    if(this.victoryMessage.length){
      this.font.draw( this.victoryMessage, 320, 184, ig.Font.ALIGN.CENTER );
    }
  },

  timeLeft: function() {
    var delta = this.gameTimer.delta() * -1;

    if ( delta <= 1 ) {
      return '';
    }

    var minutes_left = Math.floor(delta / 60);
    var seconds_left = Math.floor(delta % 60);
    if ( seconds_left < 10 ) {
      seconds_left = '0' + seconds_left;
    }
    return minutes_left + ':' + seconds_left;
  }
});



// The title screen is simply a Game Class itself; it loads the LevelTitle
// runs it and draws the title image on top.

MyTitle = ig.Game.extend({
  clearColor: "#d0f4f7",
  gravity: 800,

  // Load a font
  font: new ig.Font( 'media/fredoka-one.font.png' ),
  music: new ig.Sound( 'media/sounds/title/TitleMusic.ogg' ),
  sfxJoin: new ig.Sound( 'media/sounds/join/join.ogg' ),

  playerStatus: {
    1: false,
    2: false,
    3: false,
    4: false
  },

  init: function() {
    // Bind keys
    ig.input.bind( ig.KEY.X, 'jump' );
    ig.input.bind( ig.KEY.C, 'shoot' );

    // We want the font's chars to slightly touch each other,
    // so set the letter spacing to -2px.
    this.font.letterSpacing = -2;

    this.loadLevel( LevelTitle );
    this.maxY = this.backgroundMaps[0].pxHeight - ig.system.height;


    Gamepad.mappings.one = [
      [ 'faceButton0', 'addPlayer1' ],
      [ 'start', 'start' ]
    ];

    Gamepad.mappings.two = [
      [ 'faceButton0', 'addPlayer2' ],
      [ 'start', 'start' ]
    ];

    Gamepad.mappings.three = [
      [ 'faceButton0', 'addPlayer3' ],
      [ 'start', 'start' ]
    ];

    Gamepad.mappings.four = [
      [ 'faceButton0', 'addPlayer4' ],
      [ 'start', 'start' ]
    ];

    this.music.play()
  },

  update: function() {
    Gamepad.handleInput();

    var players = this.getEntitiesByType('EntityPlayer')
    for(var i=0;i<5;i++){
      if(ig.input.pressed('addPlayer'+i)){
        this.playerStatus[i] = true
        this.sfxJoin.getSound().setVolume(5 );
        this.sfxJoin.play()
        for(var j=0;j<players.length;j++){
          if(players[j].controller == i){
            players[j].active = true
          }
        }
      }
    }


    if(ig.input.pressed('start')){
      this.music.stop()
      var entities = this.getEntitiesByType('EntityPlayer');
      var activeCount = 0;
      for(var i=0; i< entities.length; i++){
        if(entities[i].active){
          activeCount++;
        }
      }

      if(activeCount > 1){
        window.activePlayerCount = activeCount;
        window.currentPlayerStatus = this.playerStatus;
        ig.system.setGame( MyGame );
        return;
      }else{
        this.showWarning = true;
      }
    }

    // Check for buttons; start the game if pressed
    if( ig.input.pressed('jump') || ig.input.pressed('shoot') ) {
      this.music.stop()
      window.activePlayerCount = 4;
      ig.system.setGame( MyGame );
      return;
    }

    this.parent();
  },

  draw: function() {
    this.parent();

    var cx = ig.system.width/2;
//    this.title.draw( cx - this.title.width/2, 60 );

    if(this.showWarning){
      this.font.draw( 'You need at least two players!', ig.system.width/2, 70, ig.Font.ALIGN.CENTER);
    }

    this.font.draw( 'Press A to join. Press Start to begin', cx, 20, ig.Font.ALIGN.CENTER);
  }
});


var scale = 1/2;

// We want to run the game in "fullscreen", so let's use the window's size
// directly as the canvas' style size.

var scaleCanvas = function(){
  var canvas = document.getElementById('canvas');
  canvas.style.width = '100%';

  var scaledX = window.innerWidth / gameWidth;

  if((gameHeight * scaledX) < window.innerHeight){
    canvas.style.width = '100%';
    canvas.style.height = gameHeight * scaledX + 'px';
    canvas.style.marginTop = (window.innerHeight/2 - gameHeight*scaledX/2) + 'px'
  }else{
    var scaledY = window.innerHeight / gameHeight;
    canvas.style.height = '100%';
    canvas.style.width = gameWidth * scaledY + 'px';
    canvas.style.marginLeft = (window.innerWidth/2 - gameWidth*scaledY/2) + 'px'
  }
}

scaleCanvas()
window.addEventListener('resize', function(){
  if( !ig.system ) { return; }
  scaleCanvas()
})


function randomInt(lowerBound, upperBound) {
  return lowerBound + Math.floor(Math.random()*upperBound);
}

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [v1.0]
function shuffle(o){ //v1.0
  for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
};

ig.main( '#canvas', MyTitle, 60, gameWidth*scale, gameHeight*scale, 3, ig.ImpactSplashLoader );
});
