export const AUDIO_TRACKS = [
  { file: 'the_beginning.mp3', name: 'The Beginning' },
  { file: 'three-islands-full.mp3', name: 'Three Islands' },
  { file: 'one.mp3', name: 'One' },
  { file: 'other_worlds.mp3', name: 'Other Worlds' },
  { file: 'atoms_and_light.mp3', name: 'Atoms and Light' },
];

export class AudioManager {
  private audio: HTMLAudioElement;
  private currentTrackIndex = 0;
  private volume = 1.0;
  private listeners: ((trackName: string) => void)[] = [];

  constructor() {
    this.audio = new Audio();
    this.audio.addEventListener('ended', this.playNext.bind(this));
  }

  public start() {
    this.playTrack(0);
  }

  private playTrack(index: number) {
    this.currentTrackIndex = index;
    const track = AUDIO_TRACKS[this.currentTrackIndex];
    this.audio.src = `${import.meta.env.BASE_URL}audio/${track.file}`;
    this.audio.volume = this.volume;
    this.audio.play().catch(console.error); // handle autoplay block initially if any

    this.listeners.forEach(l => l(track.name));
  }

  private playNext() {
    const nextIndex = (this.currentTrackIndex + 1) % AUDIO_TRACKS.length;
    this.playTrack(nextIndex);
  }

  public setVolume(delta: number) {
    this.volume = Math.max(0, Math.min(1, this.volume + delta));
    this.audio.volume = this.volume;
  }

  public getVolume() {
    return this.volume;
  }

  public togglePause() {
    if (this.audio.paused) {
      this.audio.play();
    } else {
      this.audio.pause();
    }
  }

  public onTrackChange(listener: (trackName: string) => void) {
    this.listeners.push(listener);
  }

  public getCurrentTrackName() {
    return AUDIO_TRACKS[this.currentTrackIndex].name;
  }

  public isPlaying() {
      return !this.audio.paused && this.audio.src !== "";
  }
}
