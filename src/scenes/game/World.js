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
        this.cameras.main.setZoom(1.5)

        //cursor
        this.input.setDefaultCursor('url(assets/img/cursor.png), pointer')

        //containers
        this.enemies = [] 
        this.trees = []
        this.ponds = []
        this.bushes = []
        this.quests = []

        //get all the quest data
        for(let i = 0; i < ammountOfQuests; i++){
            this.quests.push(this.cache.json.get(`quest-${i + 1}`)) 
        }

        
    //spawn entities and items --------------------
        objlayer.objects.forEach(element => {
            if(element.name === 'boss_spawn'){
                this.enemies.push(new Enemy(this,element.x, element.y, 'enemy-1', 0, 'Electro Lord Kealthis', 20, [element.x, element.y], 25, 400, true).anims.play('boss-1-idle-anim'))
            } else if(element.name === 'enemy_spawn'){
                this.enemies.push(new Enemy(this, element.x, element.y, 'enemy-1-anim', 0, 'Nepian Scout', 50, [element.x, element.y], 10).setScale(1.25).anims.play('enemy-idle-anim'))
            } else if(element.name === 'enemy_spawn_2'){
                this.enemies.push(new Enemy(this, element.x, element.y, 'enemy-2-anim', 0, 'Nepian Observer', 50, [element.x, element.y], 17.5, 200).setScale(1.25).anims.play('enemy2-idle-anim'))
            } else if (element.name === 'bush_1'){
               this.bushes.push(new Item(this, element.x, element.y, 'bush-1', 0, 'mysterious herb', true, false, {sound: 'collect-herb', volume: 0.1}).setScale(2).setSize(35, 30).anims.play('bush-1-anim'))
            } 
        })
    
    //spawn sprites --------------------
        objlayer.objects.forEach(element => {
            if(element.name === 'pond'){
                this.ponds.push(this.physics.add.sprite(element.x, element.y, 'water-pond', 0).setSize(22, 22).setScale(2.5).setImmovable(true).anims.play('water-moving', true))
            } else if (element.name === 'tree_1'){
               this.trees.push( this.physics.add.sprite(element.x,element.y, 'tree-1', 0).setSize(25, 2).setOffset(20,61).setDepth(2).setScale(2.5).setImmovable(true).anims.play('tree-1-anim'+ Phaser.Math.Between(0,5)))
            } else if (element.name === 'tree_2'){
               this.trees.push( this.physics.add.sprite(element.x,element.y, 'tree-2', 0).setSize(22, 2).setOffset(25,61).setDepth(2).setScale(2.5).setImmovable(true).anims.play('tree-2-anim' + Phaser.Math.Between(0,7)))
            } else if (element.name === 'tree_3'){
                let x = this.physics.add.sprite(element.x,element.y, 'tree-3', 0).setSize(30, 2).setOffset(15,62).setDepth(2).setScale(2.5).setImmovable(true).setInteractive().on('pointerdown', ()=>{
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
                this.trees.push(x)
            }
        })
        
        //create player and ally
        this.n1 = new Ally(this, npc1Spawn.x, npc1Spawn.y, 'npc-1', 0, undefined, 50).setImmovable().setSize(10,10)
        this.p1 = new Player(this, playerSpawn.x, playerSpawn.y, 'player', 0, 'p1', 5000, this.qobj, this.inv)

        //fullscreen button, credit Nathan Altice
        this.fullscreenBtn = this.add.sprite(game.config.width - 200,  game.config.height - 165, 'fullscreen').setScale(2).setScrollFactor(0).setDepth(3)
        this.fullscreenBtn.setOrigin(0.5)
        this.fullscreenBtn.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
            this.scale.toggleFullscreen()
        })

        //settings window
        this.settingsBtn = this.add.image(game.config.width - 230, game.config.height - 165, 'save').setScrollFactor(0).setDepth(3).setScale(0.75)
        this.settingsBtn.setOrigin(0.5)
        this.settingsBtn.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
            const parse_inv = JSON.stringify(Array.from(this.p1.p1Inventory.inventory.entries()))
            const parse_qst = JSON.stringify(this.p1.questStatus)
            window.localStorage.setItem('existing_inv', parse_inv)
            window.localStorage.setItem('existing_quest', parse_qst)

            let loadArrow = this.add.image(game.config.width - 230, game.config.height - 190, 'save-arrow').setScrollFactor(0).setDepth(3).setOrigin(0.5).setScale(0.75)
            this.tweens.add({
                targets: loadArrow,
                angle: {from: 0 , to: 90},
                repeat: false,
                duration: 500,
                onComplete: ()=>{
                    loadArrow.destroy()
                }
            })
            //TODO: how to go back to menu and then to world without crash...
                // this.enemies.forEach(element => {
                //     clearInterval(element.INTERVAL_ID)
                // })
                // this.scene.start('menuScene')
        })
        

        this.p1AttackUi = this.add.sprite(game.config.width/ 2 + 25, game.config.height / 2 + 200, 'attack-bar').setOrigin(0.5).setScale(3).setScrollFactor(0).setDepth(3).setInteractive().on('pointerover', ()=>{


        })

        //minimap, credit Nathan Altice
        this.miniMapCamera = this.cameras.add(game.config.width - 192, 32, 160, 160).setBounds(0, 0, game.scene.width, game.scene.height).setZoom(0.1)
        this.miniMapCamera.setBackgroundColor(0x2F3B2D)
        this.miniMapCamera.startFollow(this.p1, false, 0.4, 0.4)
        this.miniMapCamera.ignore([this.bushes, bgLayer, this.p1.HEALTH_BAR, this.p1AttackUi])
        this.enemies.forEach(element => {
            this.miniMapCamera.ignore([element.HEALTH_BAR, element.entity_text])
        })
        const mapMask =  this.make.graphics()
        mapMask.fillStyle(0xffffff)
        mapMask.fillCircle(game.config.width - 112, 112, 80)
        const mask = mapMask.createGeometryMask()
        this.miniMapCamera.setMask(mask)
        








        //debug code
        /***************************************/
        let debugToggle = this.input.keyboard.addKey('F')
        this.physics.world.drawDebug = false
        debugToggle.on('down', ()=> {
            if(this.physics.world.drawDebug) {
                this.physics.world.drawDebug = false;
                this.physics.world.debugGraphic.clear();
                this.p1.VELOCITY = 100
            }else{
                this.physics.world.drawDebug = true;
                this.p1.VELOCITY = 500
            }
        })
        /********************************************/
    }
    update(){} 
}
