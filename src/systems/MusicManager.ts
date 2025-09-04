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
        // MusicManager initialized
    }

    /**
     * Start the shuffle playlist
     */
    public startPlaylist(initialIsNight: boolean = false): void {
        if (this.isPlaying) {
            // Playlist already playing
            return;
        }
        
        this.isPlaying = true;
        this.isNightTime = initialIsNight;
        // Starting shuffle playlist
        
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
        
        // Use setTimeout to create the slot machine effect
        this.scene.time.delayedCall(delay, () => {
            this.playFirstRandomSong();
        });
    }

    /**
     * Play the first song respecting the current time of day
     */
    private playFirstRandomSong(): void {
        if (!this.isPlaying) {
            return;
        }

        // Choose playlist based on current time and priority
        let playlist: string[];
        let playedSongs: string[];
        
        if (this.isNightTime) {
            // Night time - always prefer night songs, but allow occasional day songs
            if (Math.random() < this.NIGHT_PRIORITY_CHANCE) {
                playlist = this.nightSongs;
                playedSongs = this.nightPlayedSongs;
            } else {
                playlist = this.daySongs;
                playedSongs = this.dayPlayedSongs;
            }
        } else {
            // Day time - always play day songs
            playlist = this.daySongs;
            playedSongs = this.dayPlayedSongs;
        }
        
        // Select random song from appropriate playlist
        const selectedSong = playlist[Math.floor(Math.random() * playlist.length)];
        playedSongs.push(selectedSong);
        
        this.playSong(selectedSong);
    }

    /**
     * Reset the music manager for a fresh start
     */
    public reset(): void {
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
        
        // Only log when time actually changes
        if (wasNight !== isNight) {
            // Time changed
        }
        
        // If time changed and we're playing, consider switching songs
        if (this.isPlaying && wasNight !== isNight) {
            // Small chance to switch songs when time changes
            if (Math.random() < 0.3) {
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
        
        if (this.isNightTime) {
            // Night time - always prefer night songs, but allow occasional day songs
            if (Math.random() < this.NIGHT_PRIORITY_CHANCE) {
                playlist = this.nightSongs;
                playedSongs = this.nightPlayedSongs;
            } else {
                playlist = this.daySongs;
                playedSongs = this.dayPlayedSongs;
            }
        } else {
            // Day time - always play day songs
            playlist = this.daySongs;
            playedSongs = this.dayPlayedSongs;
        }

        // Reset played songs if all have been played
        if (playedSongs.length >= playlist.length) {
            playedSongs.length = 0;
        }

        // Get available songs (not recently played)
        const availableSongs = playlist.filter(song => !playedSongs.includes(song));
        
        // Select random song from available
        const selectedSong = availableSongs[Math.floor(Math.random() * availableSongs.length)];
        playedSongs.push(selectedSong);
        
        this.playSong(selectedSong);
    }

    /**
     * Play a specific song with fade in
     */
    private playSong(songKey: string): void {
        // Stop current music if playing - immediate stop to prevent overlap
        if (this.currentMusic) {
            this.currentMusic.stop();
            this.currentMusic.destroy();
            this.currentMusic = null;
            if (this.fadeTween) {
                this.fadeTween.stop();
                this.fadeTween = null;
            }
        }

        // Create new music with volume 0
        this.currentMusic = this.scene.sound.add(songKey, {
            volume: 0, // Start at 0 for fade in
            loop: false
        });

        // Set up end event to play next song
        this.currentMusic.on('complete', () => {
            if (this.isPlaying) {
                this.playNextSong();
            }
        });

        // Play the music
        this.currentMusic.play();
        
        // Ensure volume is 0 and start fade in immediately
        this.scene.time.delayedCall(50, () => {
            if (this.currentMusic) {
                // Double-check volume is 0
                (this.currentMusic as any).setVolume(0);
                // Start fade in
                this.fadeIn();
            }
        });
        
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

        // Ensure we start from volume 0
        (this.currentMusic as any).setVolume(0);

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
