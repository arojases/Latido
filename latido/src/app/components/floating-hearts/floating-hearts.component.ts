import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';

interface FloatingHeart {
  id: number;
  left: number;
  delay: number;
  duration: number;
}

@Component({
  selector: 'app-floating-hearts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './floating-hearts.component.html',
  styleUrl: './floating-hearts.component.scss'
})
export class FloatingHeartsComponent implements OnChanges, OnDestroy {
  @Input() trigger = 0;

  protected hearts: FloatingHeart[] = [];
  private readonly timers: number[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['trigger'] || !this.trigger) {
      return;
    }

    const batch = Array.from({ length: 10 }, (_, index) => ({
      id: this.trigger * 100 + index,
      left: 8 + Math.random() * 84,
      delay: Math.random() * 200,
      duration: 2200 + Math.random() * 1100
    }));

    this.hearts = [...this.hearts, ...batch];
    const timer = window.setTimeout(() => {
      this.hearts = this.hearts.filter((heart) => !batch.some((entry) => entry.id === heart.id));
    }, 3600);

    this.timers.push(timer);
  }

  ngOnDestroy(): void {
    this.timers.forEach((timer) => window.clearTimeout(timer));
  }
}
