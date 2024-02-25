class World extends Phaser.Scene{
    constructor(){
        super('worldScene')
    }


    init(){
    }

    preload(){}

    create(){
      
        const map = this.add.tilemap('tilemapJSON')
        const tileset = map.addTilesetImage('base (1)', 'base-tileset')
        const bgLayer = map.createLayer('Background', tileset)
        const playerSpawn = map.findObject('Player/NPC', obj => obj.name === 'p_spawn')
        const npc1Spawn = map.findObject('Player/NPC', obj => obj.name === 'npc_spawn')
        const enemySpawn = map.findObject('Player/NPC', obj => obj.name === 'enemy_spawn')




        this.p1 = new Player(this, playerSpawn.x, playerSpawn.y, 'player', 0, 'p1', 100)
        this.n1 = new Ally(this, npc1Spawn.x, npc1Spawn.y, 'npc-1', 0, undefined, 50)
        this.e1 = new Enemy(this, enemySpawn.x, enemySpawn.y, 'enemy-1', 0, undefined, 150)





        // this.cameras.main.startFollow(this.player, true, 0.25,0.25)
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels)

        this.physics.world.setBounds(0,0, map.widthInPixels, map.heightInPixels)
        

        //debug code
        /*************************************** */
        let debugToggle = this.input.keyboard.addKey('F')
        this.physics.world.drawDebug = false
        debugToggle.on('down', ()=> {
            if(this.physics.world.drawDebug) {
                this.physics.world.drawDebug = false;
                this.physics.world.debugGraphic.clear();
            }else{
                this.physics.world.drawDebug = true;
            }
        })
        /******************************************* */

    }

    update(){}
    
}