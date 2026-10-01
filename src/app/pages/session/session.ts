import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { QuizCard, QuizOption, QuizService } from '../../core/services/quiz.service';
import { ProgressService } from '../../core/services/progress.service';
import { SrsService } from '../../core/services/srs.service';
import { AppDatabase } from '../../core/services/db.service';
import { Word } from '../../core/models/word.model';
import { SessionResultStore, WordMasteryChange } from '../../core/services/session-result.service';

@Component({
  selector: 'app-session',
  templateUrl: './session.html',
  styleUrl: './session.scss',
})
export class Session implements OnInit {
  readonly loading = signal(true);
  readonly card = signal<QuizCard | null>(null);
  readonly answered = signal(false);
  readonly selected = signal<QuizOption | null>(null);
  readonly progressPercent = signal(0);

  private mainQueue: Word[] = [];
  private retryQueue: Word[] = [];
  private retriedIds = new Set<number>();
  private phase: 'main' | 'retry' = 'main';
  private totalPlanned = 0;
  private answeredCount = 0;
  private correctCount = 0;
  private wrongCount = 0;
  private cardStartedAt = 0;
  private masteryChanges = new Map<number, WordMasteryChange>();

  constructor(
    private router: Router,
    private quizService: QuizService,
    private progressService: ProgressService,
    private srsService: SrsService,
    private db: AppDatabase,
    private resultStore: SessionResultStore,
  ) {}

  async ngOnInit(): Promise<void> {
    this.mainQueue = await this.quizService.getSessionWords();
    this.totalPlanned = this.mainQueue.length;
    this.loading.set(false);
    await this.loadNextCard();
  }

  private async loadNextCard(): Promise<void> {
    if (this.mainQueue.length === 0 && this.phase === 'main' && this.retryQueue.length > 0) {
      this.phase = 'retry';
      this.mainQueue = this.retryQueue;
      this.retryQueue = [];
    }

    if (this.mainQueue.length === 0) {
      await this.finishSession();
      return;
    }

    const word = this.mainQueue.shift()!;
    if (!this.masteryChanges.has(word.id)) {
      const before = await this.progressService.getMastery(word.id);
      this.masteryChanges.set(word.id, { word, before, after: before });
    }

    const settings = await this.db.getSettings();
    const card = await this.quizService.buildCard(word, settings.direction);
    this.answered.set(false);
    this.selected.set(null);
    this.card.set(card);
    this.cardStartedAt = performance.now();
  }

  async selectOption(option: QuizOption): Promise<void> {
    if (this.answered()) return;
    this.answered.set(true);
    this.selected.set(option);

    const responseTimeMs = performance.now() - this.cardStartedAt;
    const word = this.card()!.word;
    const correct = option.isCorrect;

    if (correct) {
      this.correctCount++;
    } else {
      this.wrongCount++;
      if (navigator.vibrate) navigator.vibrate(50);
      if (this.phase === 'main' && !this.retriedIds.has(word.id)) {
        this.retriedIds.add(word.id);
        this.retryQueue.push(word);
      }
    }

    this.answeredCount++;
    this.updateProgressBar();

    const updated = await this.progressService.recordAnswer(word.id, correct, responseTimeMs);
    const after = this.srsService.masteryPercent(updated);
    const change = this.masteryChanges.get(word.id);
    if (change) change.after = after;
  }

  async continue(): Promise<void> {
    await this.loadNextCard();
  }

  quit(): void {
    this.router.navigate(['/']);
  }

  speak(word: string): void {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  }

  private updateProgressBar(): void {
    const remaining = this.mainQueue.length + this.retryQueue.length;
    const total = this.answeredCount + remaining;
    this.progressPercent.set(total === 0 ? 100 : Math.round((this.answeredCount / total) * 100));
  }

  private async finishSession(): Promise<void> {
    const newAchievements = await this.progressService.finishSession(this.correctCount, this.wrongCount);
    this.resultStore.set({
      correct: this.correctCount,
      wrong: this.wrongCount,
      changes: [...this.masteryChanges.values()],
      newAchievements,
    });
    this.router.navigate(['/summary']);
  }
}
