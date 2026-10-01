import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ProgressRing } from '../../shared/components/progress-ring/progress-ring';
import { ProgressService } from '../../core/services/progress.service';
import { AppDatabase } from '../../core/services/db.service';
import { WordsService } from '../../core/services/words.service';
import { AchievementsService } from '../../core/services/achievements.service';

@Component({
  selector: 'app-home',
  imports: [ProgressRing],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  readonly loading = signal(true);
  readonly totalWords = signal(0);
  readonly masteredWords = signal(0);
  readonly learnedWords = signal(0);
  readonly duePending = signal(0);
  readonly streak = signal(0);
  readonly masteryPercent = signal(0);
  readonly unlockedAchievements = signal(0);
  readonly totalAchievements = signal(0);

  constructor(
    private router: Router,
    private progressService: ProgressService,
    private wordsService: WordsService,
    private db: AppDatabase,
    private achievementsService: AchievementsService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  private async refresh(): Promise<void> {
    await this.wordsService.loadAll();
    const stats = await this.progressService.getGlobalStats();
    const settings = await this.db.getSettings();
    const dueIds = await this.progressService.getDueWordIds();
    const newAvailable = stats.total - stats.learning;
    const remainingNewWordsToday = await this.progressService.getRemainingNewWordsToday();

    this.totalWords.set(stats.total);
    this.masteredWords.set(stats.mastered);
    this.learnedWords.set(stats.learning);
    this.streak.set(settings.streak);
    this.masteryPercent.set(stats.total === 0 ? 0 : Math.round((stats.mastered / stats.total) * 100));

    const pending = dueIds.length + Math.min(newAvailable, remainingNewWordsToday);
    this.duePending.set(pending);

    const achievementStatuses = await this.achievementsService.getStatuses();
    this.totalAchievements.set(achievementStatuses.length);
    this.unlockedAchievements.set(achievementStatuses.filter((a) => a.unlocked).length);

    this.loading.set(false);
  }

  startSession(): void {
    this.router.navigate(['/session']);
  }

  goToVocabulary(): void {
    this.router.navigate(['/vocabulary']);
  }

  goToSettings(): void {
    this.router.navigate(['/settings']);
  }

  goToAchievements(): void {
    this.router.navigate(['/achievements']);
  }
}
