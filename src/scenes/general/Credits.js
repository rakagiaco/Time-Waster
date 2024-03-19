class Credits extends Phaser.Scene{
    constructor(){
        super('Credits')
    }
    
    create(){
        //divider bar on screen
        this.divider = this.add.graphics()
        this.divider.fillStyle(0x4C5A6B, 1)
        this.divider.fillRect(game.config.width/2, 0, 10, 700)
    
        //text config    
        this.add.bitmapText(game.config.width/4, game.config.height/4, '8-bit-white', 'CREDITS', 72).setOrigin(0.5)
        this.add.bitmapText((game.config.width/4)*3, game.config.height/4, '8-bit-white', 'How to play', 72).setOrigin(0.5)
        this.add.bitmapText(game.config.width/4, game.config.height/2, 'pixel-white', ' All visual assets created by CJ Moshy', 16).setOrigin(0.5)
        this.add.bitmapText(game.config.width/4, (game.config.height/2) + 100, 'pixel-white', 'All audio from Pixabay\n\nhttps://pixabay.com/service/license-summary/', 12).setOrigin(0.5)
        this.add.bitmapText((game.config.width/4)*3, (game.config.height/4) + 100,'pixel-white', 'WASD -- move\n\n1 or 2 -- attack\n\nLSHIFT -- toggle sprint\n\nTAB -- toggle inventory\n\nLeft Mouse Button -- interact', 16).setOrigin(0.5)
        this.add.bitmapText((game.config.width/4)*3, (game.config.height/2) + 25, '8-bit-white', 'New Players', 72).setOrigin(0.5)
        this.add.bitmapText((game.config.width/4)*3, (game.config.height/2) + 170,'pixel-white', 'Click on stuff (a lot)\n\nClick on text directly\n\nStay in range of enemies\n\nGo for a swim if your hurt\n\nRespect cooldown timers\n\nYou can save and quit (whenever!)\n\nHelp menu available in game', 16).setOrigin(0.5)
        
        //nav button
        this.menuButton = this.add.sprite(game.config.width/2, 725, 'menu-button').setInteractive()  
        this.menuButton.on('pointerdown', ()=> {
            this.sound.play('click', {volume: 0.5})
            this.scene.start('menuScene')
        }) 
    }
}
