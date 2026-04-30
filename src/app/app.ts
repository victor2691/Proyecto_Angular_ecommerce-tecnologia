import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';

import { StoreFirestoreService } from './data/store-firestore.service';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit, OnDestroy {
  private readonly store = inject(StoreFirestoreService);

  protected readonly title = signal('ecommerce-tecnologia');
  protected readonly status = this.store.status;
  protected readonly errorMessage = this.store.errorMessage;
  protected readonly categories = this.store.categories;
  protected readonly products = this.store.products;
  protected readonly users = this.store.users;
  protected readonly summary = computed(() => ({
    categories: this.categories().length,
    products: this.products().length,
    users: this.users().length,
  }));

  ngOnInit(): void {
    this.store.connect();
  }

  ngOnDestroy(): void {
    this.store.disconnect();
  }

  protected async seedDemoData(): Promise<void> {
    await this.store.seedDemoData();
  }
}
