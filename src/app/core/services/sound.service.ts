import { Injectable } from '@angular/core';
import { AppDatabase } from './db.service';

@Injectable({ providedIn: 'root' })
export class SoundService {
  private correctAudio = new Audio('sounds/correct.wav');
  private wrongAudio = new Audio('sounds/wrong.wav');

  constructor(private db: AppDatabase) {
    this.correctAudio.preload = 'auto';
    this.wrongAudio.preload = 'auto';
  }

  async playCorrect(): Promise<void> {
    if (!(await this.isEnabled())) return;
    this.play(this.correctAudio);
  }

  async playWrong(): Promise<void> {
    if (!(await this.isEnabled())) return;
    this.play(this.wrongAudio);
  }

  private async isEnabled(): Promise<boolean> {
    const settings = await this.db.getSettings();
    return settings.soundEnabled;
  }

  private play(audio: HTMLAudioElement): void {
    audio.currentTime = 0;
    // Autoplay can be blocked until the user has interacted with the page;
    // a quiz answer tap always counts as that interaction, but swallow the
    // rare rejection anyway so a blocked sound never surfaces as an error.
    audio.play().catch(() => {});
  }
}
