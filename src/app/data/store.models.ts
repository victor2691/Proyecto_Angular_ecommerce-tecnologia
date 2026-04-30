export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  stock: number;
  imageUrl: string;
  featured: boolean;
}

export interface AppUser {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'customer';
  active: boolean;
}
