import { Injectable, signal } from '@angular/core';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  writeBatch,
} from 'firebase/firestore';

import { db } from '../core/firebase/firebase';
import { AppUser, Category, Product } from './store.models';

@Injectable({ providedIn: 'root' })
export class StoreFirestoreService {
  readonly categories = signal<Category[]>([]);
  readonly products = signal<Product[]>([]);
  readonly users = signal<AppUser[]>([]);
  readonly status = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');
  readonly errorMessage = signal('');

  private stopCategoriesSync?: () => void;
  private stopProductsSync?: () => void;
  private stopUsersSync?: () => void;

  connect(): void {
    if (this.status() === 'loading' || this.stopCategoriesSync) {
      return;
    }

    this.status.set('loading');
    this.errorMessage.set('');

    this.stopCategoriesSync = onSnapshot(
      query(collection(db, 'categories')),
      (snapshot) => {
        this.categories.set(
          snapshot.docs.map((entry) => ({
            id: entry.id,
            ...(entry.data() as Omit<Category, 'id'>),
          })),
        );
        this.markReady();
      },
      (error) => this.handleError(error),
    );

    this.stopProductsSync = onSnapshot(
      query(collection(db, 'products')),
      (snapshot) => {
        this.products.set(
          snapshot.docs.map((entry) => ({
            id: entry.id,
            ...(entry.data() as Omit<Product, 'id'>),
          })),
        );
        this.markReady();
      },
      (error) => this.handleError(error),
    );

    this.stopUsersSync = onSnapshot(
      query(collection(db, 'users')),
      (snapshot) => {
        this.users.set(
          snapshot.docs.map((entry) => ({
            id: entry.id,
            ...(entry.data() as Omit<AppUser, 'id'>),
          })),
        );
        this.markReady();
      },
      (error) => this.handleError(error),
    );
  }

  disconnect(): void {
    this.stopCategoriesSync?.();
    this.stopProductsSync?.();
    this.stopUsersSync?.();
    this.stopCategoriesSync = undefined;
    this.stopProductsSync = undefined;
    this.stopUsersSync = undefined;
    this.status.set('idle');
  }

  async seedDemoData(): Promise<void> {
    const [categorySnapshot, productSnapshot, userSnapshot] = await Promise.all([
      getDocs(collection(db, 'categories')),
      getDocs(collection(db, 'products')),
      getDocs(collection(db, 'users')),
    ]);

    const batch = writeBatch(db);
    let laptopCategoryId = categorySnapshot.docs.find(
      (entry) => entry.data()['slug'] === 'laptops',
    )?.id;
    let accessoriesCategoryId = categorySnapshot.docs.find(
      (entry) => entry.data()['slug'] === 'accesorios',
    )?.id;

    if (categorySnapshot.empty) {
      const laptopReference = doc(collection(db, 'categories'));
      const accessoriesReference = doc(collection(db, 'categories'));

      laptopCategoryId = laptopReference.id;
      accessoriesCategoryId = accessoriesReference.id;

      batch.set(laptopReference, {
        name: 'Laptops',
        slug: 'laptops',
        description: 'Equipos portatiles para trabajo y gaming.',
      });
      batch.set(accessoriesReference, {
        name: 'Accesorios',
        slug: 'accesorios',
        description: 'Perifericos y complementos para tu setup.',
      });
    }

    if (productSnapshot.empty) {
      const products: Array<Omit<Product, 'id'>> = [
        {
          name: 'Laptop Pro 14',
          categoryId: laptopCategoryId ?? 'missing-laptops-category',
          price: 1499,
          stock: 8,
          imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=900',
          featured: true,
        },
        {
          name: 'Mouse Inalambrico',
          categoryId: accessoriesCategoryId ?? 'missing-accessories-category',
          price: 39,
          stock: 45,
          imageUrl: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=900',
          featured: false,
        },
      ];

      for (const item of products) {
        const reference = doc(collection(db, 'products'));
        batch.set(reference, item);
      }
    }

    if (userSnapshot.empty) {
      const users: Array<Omit<AppUser, 'id'>> = [
        {
          fullName: 'Admin Ecommerce',
          email: 'admin@ecommerce.local',
          role: 'admin',
          active: true,
        },
        {
          fullName: 'Cliente Demo',
          email: 'cliente@ecommerce.local',
          role: 'customer',
          active: true,
        },
      ];

      for (const item of users) {
        const reference = doc(collection(db, 'users'));
        batch.set(reference, item);
      }
    }

    await batch.commit();
  }

  async createCategory(category: Omit<Category, 'id'>): Promise<void> {
    const reference = doc(collection(db, 'categories'));
    await setDoc(reference, category);
  }

  async createProduct(product: Omit<Product, 'id'>): Promise<void> {
    const reference = doc(collection(db, 'products'));
    await setDoc(reference, product);
  }

  async createUser(user: Omit<AppUser, 'id'>): Promise<void> {
    const reference = doc(collection(db, 'users'));
    await setDoc(reference, user);
  }

  private markReady(): void {
    if (this.status() !== 'error') {
      this.status.set('ready');
    }
  }

  private handleError(error: Error): void {
    this.status.set('error');
    this.errorMessage.set(error.message);
  }
}
