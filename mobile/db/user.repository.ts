import { db } from "./database";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  onboardingCompleted: boolean;
}

export function getUserProfile(): UserProfile | null {
  try {
    const row = db.getFirstSync<any>(`SELECT * FROM user_profile LIMIT 1`);
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      avatar: row.avatar,
      onboardingCompleted: !!row.onboardingCompleted,
    };
  } catch (e) {
    return null;
  }
}

export function saveUserProfile(name: string) {
  const existing = getUserProfile();
  const id = existing?.id || "user_1";
  const email = existing?.email || "user@example.com";
  const avatar = existing?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";

  if (existing) {
    db.runSync(
      `UPDATE user_profile 
       SET name = ?, onboardingCompleted = 1 
       WHERE id = ?`,
      [name, id]
    );
  } else {
    db.runSync(
      `INSERT INTO user_profile (id, name, email, avatar, onboardingCompleted) 
       VALUES (?, ?, ?, ?, 1)`,
      [id, name, email, avatar]
    );
  }
}

export function deleteUserProfile() {
  db.runSync(`DELETE FROM user_profile`);
}
