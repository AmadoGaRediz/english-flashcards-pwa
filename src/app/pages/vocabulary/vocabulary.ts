import { Component, OnInit, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProgressService, WordWithProgress } from '../../core/services/progress.service';

type FilterKey = 'all' | 'new' | 'learning' | 'mastered';

const MASTERY_THRESHOLD = 85;

@Component({
  selector: 'app-vocabulary',
  imports: [FormsModule],
  templateUrl: './vocabulary.html',
  styleUrl: './vocabulary.scss',
})
export class Vocabulary implements OnInit {
  readonly loading = signal(true);
  readonly search = signal('');
  readonly filter = signal<FilterKey>('all');
  private readonly allEntries = signal<WordWithProgress[]>([]);

  readonly filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'new', label: 'Nuevas' },
    { key: 'learning', label: 'Aprendiendo' },
    { key: 'mastered', label: 'Dominadas' },
  ];

  readonly visibleEntries = computed(() => {
    const query = this.search().trim().toLowerCase();
    const filter = this.filter();

    return this.allEntries().filter((entry) => {
      if (filter === 'new' && entry.progress !== null) return false;
      if (filter === 'learning' && (entry.progress === null || entry.mastery >= MASTERY_THRESHOLD)) return false;
      if (filter === 'mastered' && entry.mastery < MASTERY_THRESHOLD) return false;

      if (!query) return true;
      return (
        entry.word.en.toLowerCase().includes(query) ||
        entry.word.es.some((s) => s.toLowerCase().includes(query))
      );
    });
  });

  constructor(
    private router: Router,
    private progressService: ProgressService,
  ) {}

  async ngOnInit(): Promise<void> {
    const entries = await this.progressService.getVocabularyList();
    this.allEntries.set(entries);
    this.loading.set(false);
  }

  setFilter(key: FilterKey): void {
    this.filter.set(key);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
