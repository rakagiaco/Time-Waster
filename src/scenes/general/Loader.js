class Loader extends Phaser.Scene{
    constructor(){
        super('Loader')
    }

    init(){
    }

    preload(){

        //path
        this.load.path = './assets'

        //load tilemap
        this.load.image('base-tileset', '/tilesets/base_tileset.png')
        this.load.tilemapTiledJSON('tilemapJSON', '/tilesets/main-tileset-1.json')

        //load images (tmp)
        this.load.image('enemy-1', '/img/enemy-1.png')
        this.load.image('enemy-2', '/img/enemy-2.png')
        this.load.image('npc-1', '/img/npc-1.png')
        this.load.image('npc-2', '/img/npc-1.png')
        this.load.image('player', '/img/player.png')
    }

    create(){this.scene.start('worldScene')}


















}