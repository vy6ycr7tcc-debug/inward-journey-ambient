import { Action } from './Input';
import { Engine } from './Engine';

export enum UIState {
  TITLE,
  CHAPTER_SELECT,
  IN_FLIGHT
}

export class UIManager {
  private state: UIState = UIState.TITLE;
  private engine: Engine;

  private titleScreen = document.getElementById('title-screen')!;
  private chapterSelect = document.getElementById('chapter-select')!;
  private hud = document.getElementById('hud')!;
  private hudInfo = document.getElementById('hud-info')!;
  private hudChapter = document.getElementById('hud-chapter')!;
  private hudTrack = document.getElementById('hud-track')!;
  private pauseOverlay = document.getElementById('pause-overlay')!;
  private cardsContainer = document.querySelector('.cards-container')!;

  private chapters = [
      { title: 'Descent', desc: 'A slow fall through a deep-blue cavern' },
      { title: 'Ember Field', desc: 'A warm field over dark water' },
      { title: 'Still Water', desc: 'A dark mirror-still lake' }
  ];
  private focusedCardIndex = 0;

  private hudTimeout: number | null = null;

  constructor(engine: Engine) {
    this.engine = engine;
    this.buildChapterCards();

    this.engine.input.addListener(this.handleInput.bind(this));
    this.engine.audio.onTrackChange(this.updateTrackName.bind(this));
    this.engine.onChapterChange(this.updateChapterFocus.bind(this));
  }

  private updateChapterFocus(index: number) {
      if (this.state === UIState.IN_FLIGHT) {
          this.focusedCardIndex = index;
          this.showHUD(this.chapters[index].title, this.engine.audio.getCurrentTrackName());
      }
  }

  private buildChapterCards() {
      this.chapters.forEach((ch, idx) => {
          const card = document.createElement('div');
          card.className = `card ${idx === this.focusedCardIndex ? 'focused' : ''}`;
          card.innerHTML = `<h3>${ch.title}</h3><p>${ch.desc}</p>`;
          this.cardsContainer.appendChild(card);
      });
  }

  private updateCardFocus() {
      const cards = this.cardsContainer.children;
      for (let i = 0; i < cards.length; i++) {
          if (i === this.focusedCardIndex) {
              cards[i].classList.add('focused');
          } else {
              cards[i].classList.remove('focused');
          }
      }
  }

  private handleInput(action: Action) {
      switch (this.state) {
          case UIState.TITLE:
              if (action === Action.OK) {
                  this.setState(UIState.CHAPTER_SELECT);
              }
              break;

          case UIState.CHAPTER_SELECT:
              if (action === Action.LEFT) {
                  this.focusedCardIndex = Math.max(0, this.focusedCardIndex - 1);
                  this.updateCardFocus();
              } else if (action === Action.RIGHT) {
                  this.focusedCardIndex = Math.min(this.chapters.length - 1, this.focusedCardIndex + 1);
                  this.updateCardFocus();
              } else if (action === Action.OK) {
                  this.startFlight(this.focusedCardIndex);
              } else if (action === Action.BACK) {
                  this.setState(UIState.TITLE);
              }
              break;

          case UIState.IN_FLIGHT:
              if (action === Action.OK) {
                  this.engine.togglePause();
                  if (this.engine.isAppPaused()) {
                      this.pauseOverlay.classList.remove('hidden');
                  } else {
                      this.pauseOverlay.classList.add('hidden');
                  }
              } else if (action === Action.BACK) {
                  this.engine.togglePause(); // ensure unpaused
                  if(this.engine.isAppPaused()) {
                      this.engine.togglePause();
                  }
                  this.pauseOverlay.classList.add('hidden');
                  this.setState(UIState.CHAPTER_SELECT);
              } else if (action === Action.UP) {
                  this.engine.audio.setVolume(0.1);
              } else if (action === Action.DOWN) {
                  this.engine.audio.setVolume(-0.1);
              }
              break;
      }
  }

  private startFlight(index: number) {
      this.setState(UIState.IN_FLIGHT);
      this.engine.startChapter(index);

      // Ensure audio starts if it hasn't already
      // Typically on first user interaction, browser allows audio.
      if (!this.engine.audio.isPlaying()) {
          this.engine.audio.start();
      }

      this.showHUD(this.chapters[index].title, this.engine.audio.getCurrentTrackName());
  }

  private updateTrackName(trackName: string) {
      if (this.state === UIState.IN_FLIGHT) {
           // We might not know the chapter title easily without asking engine,
           // but we can just use the current known one or hide chapter name.
           // For simplicity, we just show track name when it changes.
           this.showHUD(this.chapters[this.focusedCardIndex].title, trackName);
      }
  }

  private showHUD(chapterTitle: string, trackName: string) {
      this.hudChapter.textContent = chapterTitle;
      this.hudTrack.textContent = trackName || 'Playing...';

      this.hudInfo.classList.remove('fade-out');

      if (this.hudTimeout) {
          clearTimeout(this.hudTimeout);
      }

      this.hudTimeout = window.setTimeout(() => {
          this.hudInfo.classList.add('fade-out');
      }, 5000);
  }

  private setState(newState: UIState) {
      this.state = newState;

      this.titleScreen.classList.add('hidden');
      this.chapterSelect.classList.add('hidden');
      this.hud.classList.add('hidden');

      switch (newState) {
          case UIState.TITLE:
              this.titleScreen.classList.remove('hidden');
              break;
          case UIState.CHAPTER_SELECT:
              this.chapterSelect.classList.remove('hidden');
              break;
          case UIState.IN_FLIGHT:
              this.hud.classList.remove('hidden');
              break;
      }
  }
}
