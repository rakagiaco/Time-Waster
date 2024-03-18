class Menu extends Phaser.Scene{
    constructor(){
        super('menuScene')
    }

    create(data){
        //title
        this.add.bitmapText(game.config.width/2, game.config.height/2 - 25,'8-bit', 'Time Waster', 96).setOrigin(0.5)
        
        this.cameras.main.setBackgroundColor('0xffffff')
        //todo CONTINUE ART
        this.continueButton = this.add.image(game.config.width/2 - 150, game.config.height/2+ 200, 'continue-game-button').setInteractive({ useHandCursor: true }).on('pointerdown', ()=>{
            this.scene.start('worldScene', data)
        }) 

        //todo NEW GAME ART 
        this.newGameBtn = this.add.image(game.config.width/2 + 150, game.config.height/2+ 200, 'new-game-button').setInteractive({ useHandCursor: true }).on('pointerdown', () => {
            window.localStorage.removeItem('existing_inv')
            window.localStorage.removeItem('existing_quest')
            data.inv = undefined
            data.qobj = undefined
            
        })
    }
}