class World extends Phaser.Scene{
    constructor(){
        super('worldScene')
    }

    init(data){
        this.qobj = data.qobj
        this.inv = data.inv
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

        //camera stuff
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
        this.physics.world.setBounds(0,0, map.widthInPixels, map.heightInPixels)

        //cursor
        this.input.setDefaultCursor('url(assets/img/cursor.png), pointer')
        // this.input.on('pointerdown', ()=>{
        //     this.input.setDefaultCursor('url(assets/img/cursor-2.png), pointer')
        //     this.time.delayedCall(250, ()=>{this.input.setDefaultCursor('url(assets/img/cursor.png), pointer')})
        // })

        //containers
        this.enemies = [] 
        this.bushes = []
        this.quests = []

        //get all the quest data
        for(let i = 0; i < ammountOfQuests; i++){
            this.quests.push(this.cache.json.get(`quest-${i + 1}`)) 
        }

        //spawn sprites
        this.watersprite = this.physics.add.sprite(1000,200, 'water-pond', 0).setScale(5).setImmovable(true)
        this.watersprite.anims.play('water-moving', true)

        objlayer.objects.forEach(element => {
            if(element.name === 'boss_spawn'){
                this.enemies.push(new Enemy(this,element.x, element.y, 'enemy-1', 0, 'Electro Lord Kealthis', 200, [element.x, element.y], 25, 400, true))
            }
            if(element.name === 'enemy_spawn'){
                this.enemies.push(new Enemy(this, element.x, element.y, 'enemy-1-anim', 0, 'Nepian Scout', 50, [element.x, element.y], 10).setScale(1.25).anims.play('enemy-idle-anim'))
            } else if(element.name === 'enemy_spawn_2'){
                this.enemies.push(new Enemy(this, element.x, element.y, 'enemy-2-anim', 0, 'Nepian Observer', 50, [element.x, element.y], 17.5, 200).setScale(1.25).anims.play('enemy2-idle-anim'))
            } else if (element.name === 'bush_1'){
               this.bushes.push(new Item(this, element.x, element.y, 'bush-1', 0, 'mysterious herb', true, false, {sound: 'collect-herb', volume: 0.1}).setSize(25).anims.play('bush-1-anim'))
            } 
        })

        objlayer.objects.forEach(element => {
            if (element.name === 'tree_1'){
                this.physics.add.sprite(element.x,element.y, 'tree-2', 0).setDepth(2).setScale(2.5).setImmovable(true).anims.play('tree-1-anim'+ Phaser.Math.Between(0,5))
            } else if (element.name === 'tree_2'){
                this.physics.add.sprite(element.x,element.y, 'tree-2', 0).setDepth(2).setScale(2.5).setImmovable(true).anims.play('tree-2-anim' + Phaser.Math.Between(0,7))
            } else if (element.name === 'tree_3'){
                let x = this.physics.add.sprite(element.x,element.y, 'tree-3', 0).setDepth(2).setScale(2.5).setImmovable(true).setInteractive().on('pointerdown', ()=>{
                    if(listen(this, x)){
                        toggleCursor(this)
                        x.anims.play('tree-3-anim')
                        this.time.delayedCall(2000,()=>{
                            let y = new Item(this, x.x, x.y, 'fruit', 0, 'fruit', true, true).setAlpha(0)
                            this.p1.windowOpen ? undefined : createLootInterfaceWindow(y, this)
                        })
                        x.input.enabled = false
                    }
                })
            }
        })
 
        this.p1 = new Player(this, playerSpawn.x, playerSpawn.y, 'player', 0, 'p1', 500, this.qobj, this.inv) 
        this.n1 = new Ally(this, npc1Spawn.x, npc1Spawn.y, 'npc-1', 0, undefined, 50)

        //fullscreen button credit Nathan Altice
        this.fullscreenBtn = this.add.sprite(game.config.width - 25, game.config.height - 15, 'fullscreen').setScale(2).setScrollFactor(0).setDepth(3)
        this.fullscreenBtn.setOrigin(1)
        this.fullscreenBtn.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
            this.scale.toggleFullscreen()
        })

        //settings window
        this.settingsBtn = this.add.sprite(game.config.width - 75, game.config.height - 15, 'save').setScrollFactor(0).setDepth(3)
        this.settingsBtn.setOrigin(1)
        this.settingsBtn.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
            const parse_inv = JSON.stringify(Array.from(this.p1.p1Inventory.inventory.entries()))
            const parse_qst = JSON.stringify(this.p1.questStatus)
            window.localStorage.setItem('existing_inv', parse_inv)
            window.localStorage.setItem('existing_quest', parse_qst)
            // this.enemies.forEach(element => {
            //     clearInterval(element.INTERVAL_ID)
            // })
            // this.scene.start('menuScene')
        })
    

        //debug code
        /***************************************/
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
        /********************************************/
    }

    update(){} 
}
