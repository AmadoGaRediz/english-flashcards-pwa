import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-progress-ring',
  templateUrl: './progress-ring.html',
  styleUrl: './progress-ring.scss',
})
export class ProgressRing {
  readonly percent = input(0);
  readonly size = input(180);
  readonly strokeWidth = input(16);

  protected readonly radius = computed(() => (this.size() - this.strokeWidth()) / 2);
  protected readonly circumference = computed(() => 2 * Math.PI * this.radius());
  protected readonly dashOffset = computed(
    () => this.circumference() * (1 - this.percent() / 100),
  );
  protected readonly center = computed(() => this.size() / 2);
}
