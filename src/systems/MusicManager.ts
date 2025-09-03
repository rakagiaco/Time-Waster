/**
 * Music Manager System
 * 
 * Handles shuffle playlist with fade in/out transitions and day/night priority.
 * Night songs have priority but day songs can still play during night time.
 */

export class MusicManager {
    private scene: Phaser.Scene;
    private currentMusic: Phaser.Sound.BaseSound | null = null;
    private fadeTween: Phaser.Tweens.Tween | null = null;
    private isPlaying: boolean = false;
    private isNightTime: boolean = false;
    
    // Playlists
    private daySongs: string[] = [
        'shuffle-divo',
        'shuffle-j178', 
        'shuffle-maude',
        'shuffle-wahwah'
    ];
    
    private nightSongs: string[] = [
        'shuffle-dream2',
        'shuffle-jeeno',
        'shuffle-lucid',
        'shuffle-n187'
    ];
    
    // Shuffle tracking
    private dayPlayedSongs: string[] = [];
    private nightPlayedSongs: string[] = [];
    
    // Configuration
    private readonly FADE_DURATION = 2000; // 2 seconds
    private readonly TARGET_VOLUME = 0.0975375; // Quiet background music (reduced by 35% total)
    private readonly NIGHT_PRIORITY_CHANCE = 0.7; // 70% chance night songs play during night

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        console.log('MusicManager: Initialized');
    }

    /**
     * Start the shuffle playlist
     */
    public startPlaylist(): void {
        if (this.isPlaying) {
            console.log('MusicManager: Playlist already playing');
            return;
        }
        
        this.isPlaying = true;
        console.log('MusicManager: Starting shuffle playlist');
        
        // Add some randomization to the initial song selection
        // This ensures the first song isn't always the same
        this.randomizeInitialState();
    }

    /**
     * Randomize the initial state to ensure variety in first song
     */
    private randomizeInitialState(): void {
        // Clear the played lists completely
        this.dayPlayedSongs = [];
        this.nightPlayedSongs = [];
        
        // Add random delay to simulate "slot machine" effect
        const delay = Math.random() * 1000 + 500; // 0.5-1.5 second delay
        
        console.log(`MusicManager: Slot machine rolling... (${Math.round(delay)}ms delay)`);
        
        // Use setTimeout to create the slot machine effect
        this.scene.time.delayedCall(delay, () => {
            console.log('MusicManager: Slot machine stopped! Playing first song...');
            this.playFirstRandomSong();
        });
    }

    /**
     * Play the first song with true randomization across all songs
     */
    private playFirstRandomSong(): void {
        if (!this.isPlaying) {
            return;
        }

        // Combine all songs for true randomization
        const allSongs = [...this.daySongs, ...this.nightSongs];
        
        // Select completely random song from all available songs
        const selectedSong = allSongs[Math.floor(Math.random() * allSongs.length)];
        
        // Add to appropriate played list based on which playlist it belongs to
        if (this.daySongs.includes(selectedSong)) {
            this.dayPlayedSongs.push(selectedSong);
            console.log('MusicManager: First song from day playlist');
        } else {
            this.nightPlayedSongs.push(selectedSong);
            console.log('MusicManager: First song from night playlist');
        }
        
        console.log(`MusicManager: First random song selected: ${selectedSong}`);
        this.playSong(selectedSong);
    }

    /**
     * Reset the music manager for a fresh start
     */
    public reset(): void {
        console.log('MusicManager: Resetting for fresh start');
        this.stopPlaylist();
        this.dayPlayedSongs = [];
        this.nightPlayedSongs = [];
        this.isNightTime = false;
    }

    /**
     * Stop the shuffle playlist
     */
    public stopPlaylist(): void {
        if (!this.isPlaying) {
            return;
        }
        
        this.isPlaying = false;
        console.log('MusicManager: Stopping shuffle playlist');
        
        if (this.currentMusic) {
            this.fadeOutAndStop();
        }
    }

    /**
     * Update time of day (called by day/night cycle)
     */
    public updateTimeOfDay(isNight: boolean): void {
        const wasNight = this.isNightTime;
        this.isNightTime = isNight;
        
        console.log(`MusicManager: Time updated - isNight: ${isNight}`);
        
        // If time changed and we're playing, consider switching songs
        if (this.isPlaying && wasNight !== isNight) {
            // Small chance to switch songs when time changes
            if (Math.random() < 0.3) {
                console.log('MusicManager: Time changed, switching song');
                this.playNextSong();
            }
        }
    }

    /**
     * Play the next song in the shuffle
     */
    private playNextSong(): void {
        if (!this.isPlaying) {
            return;
        }

        // Choose playlist based on time and priority
        let playlist: string[];
        let playedSongs: string[];
        
        if (this.isNightTime && Math.random() < this.NIGHT_PRIORITY_CHANCE) {
            // Night time with night priority
            playlist = this.nightSongs;
            playedSongs = this.nightPlayedSongs;
            console.log('MusicManager: Using night playlist (priority)');
        } else {
            // Day time or night time without priority
            playlist = this.daySongs;
            playedSongs = this.dayPlayedSongs;
            console.log('MusicManager: Using day playlist');
        }

        // Reset played songs if all have been played
        if (playedSongs.length >= playlist.length) {
            playedSongs.length = 0;
            console.log('MusicManager: Reset played songs for', this.isNightTime ? 'night' : 'day');
        }

        // Get available songs (not recently played)
        const availableSongs = playlist.filter(song => !playedSongs.includes(song));
        
        // Select random song from available
        const selectedSong = availableSongs[Math.floor(Math.random() * availableSongs.length)];
        playedSongs.push(selectedSong);
        
        console.log(`MusicManager: Selected song: ${selectedSong}`);
        this.playSong(selectedSong);
    }

    /**
     * Play a specific song with fade in
     */
    private playSong(songKey: string): void {
        // Stop current music if playing
        if (this.currentMusic) {
            this.fadeOutAndStop();
        }

        // Create new music
        this.currentMusic = this.scene.sound.add(songKey, {
            volume: 0, // Start at 0 for fade in
            loop: false
        });

        // Force volume to 0 immediately to prevent any loud initial notes
        this.currentMusic.setVolume(0);

        // Set up end event to play next song
        this.currentMusic.on('complete', () => {
            if (this.isPlaying) {
                console.log('MusicManager: Song ended, playing next');
                this.playNextSong();
            }
        });

        // Play and immediately start fade in
        this.currentMusic.play();
        
        // Start fade in immediately to prevent any loud initial notes
        this.scene.time.delayedCall(10, () => {
            this.fadeIn();
        });
        
        console.log(`MusicManager: Playing ${songKey}`);
    }

    /**
     * Fade in current music
     */
    private fadeIn(): void {
        if (!this.currentMusic) return;

        // Stop any existing fade tween
        if (this.fadeTween) {
            this.fadeTween.stop();
        }

        this.fadeTween = this.scene.tweens.add({
            targets: this.currentMusic,
            volume: this.TARGET_VOLUME,
            duration: this.FADE_DURATION,
            ease: 'Power2',
            onComplete: () => {
                this.fadeTween = null;
            }
        });
    }

    /**
     * Fade out and stop current music
     */
    private fadeOutAndStop(): void {
        if (!this.currentMusic) return;

        // Stop any existing fade tween
        if (this.fadeTween) {
            this.fadeTween.stop();
        }

        this.fadeTween = this.scene.tweens.add({
            targets: this.currentMusic,
            volume: 0,
            duration: this.FADE_DURATION,
            ease: 'Power2',
            onComplete: () => {
                if (this.currentMusic) {
                    this.currentMusic.stop();
                    this.currentMusic.destroy();
                    this.currentMusic = null;
                }
                this.fadeTween = null;
            }
        });
    }

    /**
     * Get current status for debugging
     */
    public getStatus(): any {
        return {
            isPlaying: this.isPlaying,
            isNightTime: this.isNightTime,
            currentSong: this.currentMusic?.key || 'none',
            dayPlayedCount: this.dayPlayedSongs.length,
            nightPlayedCount: this.nightPlayedSongs.length
        };
    }
}
