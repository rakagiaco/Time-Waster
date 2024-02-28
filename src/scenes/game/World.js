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
        const tileset = map.addTilesetImage('base (1)', 'base-tileset')
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
        //spawn entities
        this.enemies = [] // physics group overrites properties
        objlayer.objects.forEach(element => {
            if(element.name === 'enemy_spawn')
            this.enemies.push(new Enemy(this, element.x, element.y, 'enemy-1', 0, 'Nepian Scout', 150, [element.x, element.y]))
        });
        this.p1 = new Player(this, playerSpawn.x, playerSpawn.y, 'player', 0, 'p1', 100)
        this.n1 = new Ally(this, npc1Spawn.x, npc1Spawn.y, 'npc-1', 0, undefined, 50)
        
        

        //debug code
        /*************************************** */
        this.p1.VELOCITY = 400
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