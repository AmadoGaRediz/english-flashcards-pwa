import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AchievementsService, AchievementStatus } from '../../core/services/achievements.service';

@Component({
  selector: 'app-achievements',
  templateUrl: './achievements.html',
  styleUrl: './achievements.scss',
})
export class Achievements implements OnInit {
  readonly loading = signal(true);
  readonly statuses = signal<AchievementStatus[]>([]);
  readonly unlockedCount = signal(0);

  constructor(
    private router: Router,
    private achievementsService: AchievementsService,
  ) {}

  async ngOnInit(): Promise<void> {
    const statuses = await this.achievementsService.getStatuses();
    this.statuses.set(statuses);
    this.unlockedCount.set(statuses.filter((s) => s.unlocked).length);
    this.loading.set(false);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
