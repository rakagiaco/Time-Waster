class World extends Phaser.Scene{
    constructor(){
        super('worldScene')
    }


    init(){
    }

    preload(){}

    create(){
    
        //load map
        const map = this.add.tilemap('tilemapJSON')
        const tileset = map.addTilesetImage('base_tileset', 'base-tileset')
        const bgLayer = map.createLayer('Background', tileset)
        const playerSpawn = map.findObject('Player/NPC', obj => obj.name === 'p_spawn')
        const npc1Spawn = map.findObject('Player/NPC', obj => obj.name === 'npc_spawn')
        const objlayer = map.getObjectLayer('Player/NPC')

        // const enemySpawn = map.findObject('Player/NPC', obj => obj.name === 'enemy_spawn')
        
        //camera stuff
        // this.cameras.main.startFollow(this.player, true, 0.25,0.25)
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
        this.physics.world.setBounds(0,0, map.widthInPixels, map.heightInPixels)

        //encapsulate quests 
        this.quests = []
        for(let i = 0; i < 5; i++){
            this.quests.push(this.cache.json.get(`quest-${i + 1}`)) 
        }

        console.log(this.cameras.main.x)


        //spawn sprites
         
        this.watersprite = this.physics.add.sprite(1000,200, 'water-pond', 0).setScale(5).setImmovable(true)
        this.watersprite.anims.play('water-moving', true)

       // this.mountains = this.physics.add.sprite(3500, 1250, 'mountains', 0).setScale(3).setRotation(2)

        //spawn entities
        this.enemies = [] // physics group overrites properties
        objlayer.objects.forEach(element => {
            if(element.name === 'enemy_spawn')
            this.enemies.push(new Enemy(this, element.x, element.y, 'enemy-1', 0, 'Nepian Scout', 150, [element.x, element.y]))
        });
        this.p1 = new Player(this, playerSpawn.x, playerSpawn.y, 'player', 0, 'p1', 100)
        this.n1 = new Ally(this, npc1Spawn.x, npc1Spawn.y, 'npc-1', 0, undefined, 50)
        
        this.physics.add.overlap(this.p1, this.watersprite, ()=>{
            if(this.p1.animsFSM.state != 'swim'){
                this.sound.stopAll()
                this.p1.animsFSM.transition('swim')
            }
        })


        //debug code
        /*************************************** */
        this.p1.VELOCITY = 1000
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

    update(){
       
    }
    
}