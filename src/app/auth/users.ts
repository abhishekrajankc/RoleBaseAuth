export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user';
  passwordHash: string;
}

/** Pre-computed SHA-256 hashes (salted with 'auth-salt') */
const HASHES :any = {
  password123: '$2y$12$Qq4jhf9eGH0IqncYxu1uCurIjhul6NhBBFQCL4/e4IQszUI2g5t7y',
  adminpass:   '$2y$12$aFzJhBj/Giuwk1E0rCAz6O5HPRSJtUknJBmOaWng9z4ORW7b3I/iy',
  userpass:    '$2y$12$KySL0uf.69ZPDsOVuJ4MD.9j807PzJAZJfCk5u7LsDbcgM8KKcHo6',
  password456: '$2y$12$p2iS6OKAygwD8zUptHsWk.T5Xr.JMk0Rce0RYLEf6aYjZFaLYi9cW',
};

function hashPassword(password: string): string {
   
  return HASHES[password] ?? '';
}

export function findUser(email: string, password: string): User | undefined {
  return USERS.find((u) => u.email === email && u.passwordHash === hashPassword(password));
}

export const USERS: User[] = [
  {
    id: 1,
    email: 'admin1@test.com',
    name: 'Admin One',
    role: 'admin',
    passwordHash: HASHES['password123'],
  },
  {
    id: 2,
    email: 'admin2@test.com',
    name: 'Admin Two',
    role: 'admin',
    passwordHash: HASHES['adminpass'],
  },
  {
    id: 3,
    email: 'user1@test.com',
    name: 'User One',
    role: 'user',
    passwordHash: HASHES['userpass'],
  },
  {
    id: 4,
    email: 'user2@test.com',
    name: 'User Two',
    role: 'user',
    passwordHash: HASHES['password456'],
  },
];