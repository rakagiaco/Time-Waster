class World extends Phaser.Scene{
    constructor(){
        super('worldScene')
    }


    init(){
        this.VEL = 200
    }

    preload(){}

    create(){
      
        const map = this.add.tilemap('tilemapJSON')

        const tileset = map.addTilesetImage('base (1)', 'base-tileset')
      

        const bgLayer = map.createLayer('Background', tileset)

        const playerSpawn = map.findObject('Player/NPC', obj => obj.name === 'p_spawn')
        const npc1Spawn = map.findObject('Player/NPC', obj => obj.name === 'npc_spawn')
        const enemySpawn = map.findObject('Player/NPC', obj => obj.name === 'enemy_spawn')

        this.player = this.physics.add.sprite(playerSpawn.x, playerSpawn.y, 'player', 0).setScale(2.5).setCollideWorldBounds(true)
        this.npc1 = this.physics.add.sprite(npc1Spawn.x, npc1Spawn.y, 'npc-1', 0).setScale(2.5)
        this.enemy = this.physics.add.sprite(enemySpawn.x, enemySpawn.y, 'enemy-1').setScale(2.5)

        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
        this.cameras.main.startFollow(this.player, true, 0.25,0.25)

        this.physics.world.setBounds(0,0, map.widthInPixels, map.heightInPixels)
        
        this.cursors = this.input.keyboard.createCursorKeys()





        //debug code
        /*************************************** */
        let debugToggle = this.input.keyboard.addKey('D')
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

    update(){
        
        // slime movement
        this.direction = new Phaser.Math.Vector2(0)
        if(this.cursors.left.isDown) {
            this.direction.x = -1
        } else if(this.cursors.right.isDown) {
            this.direction.x = 1
        }

        if(this.cursors.up.isDown) {
            this.direction.y = -1
        } else if(this.cursors.down.isDown) {
            this.direction.y = 1
        }

        this.direction.normalize()
        this.player.setVelocity(this.VEL * this.direction.x, this.VEL * this.direction.y)
    }
    
}