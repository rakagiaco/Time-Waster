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

        //load animated sprites
        this.load.spritesheet('water-pond', '/spritesheets/water-anims.png', {frameWidth: 32, frameHeight: 32},)
        


        //load images (tmp)
        this.load.image('enemy-1', '/img/enemy-1.png')
        this.load.image('enemy-2', '/img/enemy-2.png')
        this.load.image('npc-1', '/img/npc-1.png')
        this.load.image('npc-2', '/img/npc-1.png')
        this.load.image('player', '/img/player.png')
        this.load.image('mountains', '/img/mountains.png')

        //load quests
        this.load.json('quest-1', '/quests/quest-1.json')
        this.load.json('quest-2', '/quests/quest-2.json')
        this.load.json('quest-3', '/quests/quest-3.json')
        this.load.json('quest-4', '/quests/quest-4.json')
        this.load.json('quest-5', '/quests/quest-5.json')

        //load audio
        this.load.audio('in-water', '/audio/in-water.mp3')
        this.load.audio('walking', '/audio/walking-dirt.mp3')
    }   

    create(){
        

        /* this.anims.create({
            key: 'running_vanilla',
            frames: this.anims.generateFrameNames('player', {
                prefix: 'character-anim-',
                start: 1,
                end: 4
            }),
            frameRate: 15,
            repeat: -1
        })
        */
        
        this.anims.create({
            key: 'water-moving',
            frames: this.anims.generateFrameNumbers('water-pond', {start: 0, end: 5}),
            frameRate: 4,
            repeat: -1
        })
        
        
        
        
    this.scene.start('worldScene')
    }
}
