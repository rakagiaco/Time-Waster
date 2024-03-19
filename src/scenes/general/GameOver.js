class GameOver extends Phaser.Scene{
    constructor(){
        super('gameOver')
    }
    
    init(){}
    create(){
        this.time.delayedCall(1500, ()=> {
            this.sound.play('game-over')
            this.add.bitmapText(game.config.width/2, game.config.height/2 - 25,'8-bit-white', 'Time Waster', 96).setOrigin(0.5)
            this.menuButton = this.add.sprite(game.config.width/2,  (game.config.height/2) + 100, 'menu-button').setInteractive()  
            this.menuButton.on('pointerdown', ()=> {
                this.sound.play('click')
                this.scene.start('menuScene')
            })

            this.continueButton = this.add.image(game.config.width/2, (game.config.height/2) + 50,'freeplay-button').setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', ()=>{
                //load existing gamestates...
                if(window.localStorage.getItem('existing_quest') != null) {
                    var x = JSON.parse(window.localStorage.getItem('existing_quest'))
                    //console.log(x)
                }

                if(window.localStorage.getItem('existing_inv') != null) {
                    const parse = JSON.parse(window.localStorage.getItem('existing_inv'))
                    var y = new Map(parse)
                    //console.log(y)
                }
                this.sound.play('click', {volume: 0.5})
                this.scene.start('worldScene', {qobj: x, inv: y} )
            }) 
        })
    }
}