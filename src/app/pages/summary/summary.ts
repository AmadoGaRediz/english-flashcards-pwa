import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SessionResult, SessionResultStore, WordMasteryChange } from '../../core/services/session-result.service';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary implements OnInit {
  readonly result = signal<SessionResult | null>(null);

  constructor(
    private router: Router,
    private resultStore: SessionResultStore,
  ) {}

  ngOnInit(): void {
    const result = this.resultStore.consume();
    if (!result) {
      this.router.navigate(['/']);
      return;
    }
    this.result.set(result);
  }

  delta(change: WordMasteryChange): number {
    return change.after - change.before;
  }

  studyAgain(): void {
    this.router.navigate(['/session']);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
