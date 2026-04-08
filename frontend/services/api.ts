import Constants from 'expo-constants';

const devHost = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
export const BASE_URL = `http://${devHost}:8000`;

// ── Types ──────────────────────────────────────────────────────────────────

export type LoginResponse = { token: string };

export type RegisterResponse = { token: string; username: string };

export type Character = {
  id: number;
  name: string;
  race: string;
  character_class: string;
  level: number;
  hp_max: number;
  hp_current: number;
  background: string;
  alignment: string;
  xp: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  armor_class: number;
  strength_modifier: number;
  dexterity_modifier: number;
  constitution_modifier: number;
  intelligence_modifier: number;
  wisdom_modifier: number;
  charisma_modifier: number;
  created_at: string;
  updated_at: string;
};

export type Spell = {
  id: number;
  name: string;
  level: number;
  casting_time: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  created_at: string;
};

export type SpellSlot = {
  id: number;
  slot_level: number;
  total: number;
  used: number;
  remaining: number;
};

export type InventoryItem = {
  id: number;
  name: string;
  weight: number;
  quantity: number;
  equipped: boolean;
  created_at: string;
};

export type RollHistory = {
  id: number;
  roll_type: string;
  dice_type: string;
  num_dice: number;
  base_roll: number;
  modifier: number;
  total: number;
  created_at: string;
};

// ── Core fetch helper ──────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Token ${token}` } : {}),
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const body = await res.json();
      message =
        body?.non_field_errors?.[0] ??
        body?.detail ??
        body?.password?.[0] ??
        body?.username?.[0] ??
        message;
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── API functions ──────────────────────────────────────────────────────────

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request<LoginResponse>('/api/token/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  register: (username: string, password: string, password2: string) =>
    request<RegisterResponse>('/api/register/', {
      method: 'POST',
      body: JSON.stringify({ username, password, password2 }),
    }),

  // Characters
  getCharacters: (token: string) =>
    request<Character[]>('/api/characters/', {}, token),

  getCharacter: (token: string, id: number) =>
    request<Character>(`/api/characters/${id}/`, {}, token),

  createCharacter: (token: string, data: Partial<Character>) =>
    request<Character>('/api/characters/', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token),

  updateCharacter: (token: string, id: number, data: Partial<Character>) =>
    request<Character>(`/api/characters/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, token),

  deleteCharacter: (token: string, id: number) =>
    request<void>(`/api/characters/${id}/`, { method: 'DELETE' }, token),

  // Spells
  getSpells: (token: string, charId: number) =>
    request<Spell[]>(`/api/characters/${charId}/spells/`, {}, token),

  addSpell: (token: string, charId: number, data: Omit<Spell, 'id' | 'created_at'>) =>
    request<Spell>(`/api/characters/${charId}/spells/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, token),

  deleteSpell: (token: string, charId: number, spellId: number) =>
    request<void>(`/api/characters/${charId}/spells/${spellId}/`, { method: 'DELETE' }, token),

  // Spell Slots
  getSpellSlots: (token: string, charId: number) =>
    request<SpellSlot[]>(`/api/characters/${charId}/spell-slots/`, {}, token),

  createSpellSlot: (token: string, charId: number, data: { slot_level: number; total: number; used: number }) =>
    request<SpellSlot>(`/api/characters/${charId}/spell-slots/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, token),

  updateSpellSlot: (token: string, charId: number, slotId: number, data: Partial<SpellSlot>) =>
    request<SpellSlot>(`/api/characters/${charId}/spell-slots/${slotId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, token),

  // Inventory
  getInventory: (token: string, charId: number) =>
    request<InventoryItem[]>(`/api/characters/${charId}/inventory/`, {}, token),

  addItem: (token: string, charId: number, data: Omit<InventoryItem, 'id' | 'created_at'>) =>
    request<InventoryItem>(`/api/characters/${charId}/inventory/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, token),

  updateItem: (token: string, charId: number, itemId: number, data: Partial<InventoryItem>) =>
    request<InventoryItem>(`/api/characters/${charId}/inventory/${itemId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, token),

  deleteItem: (token: string, charId: number, itemId: number) =>
    request<void>(`/api/characters/${charId}/inventory/${itemId}/`, { method: 'DELETE' }, token),

  // Roll History
  getRolls: (token: string) =>
    request<RollHistory[]>('/api/rolls/', {}, token),

  saveRoll: (token: string, data: Omit<RollHistory, 'id' | 'created_at'>) =>
    request<RollHistory>('/api/rolls/', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token),

  clearRolls: (token: string) =>
    request<void>('/api/rolls/clear/', { method: 'DELETE' }, token),

  // Dice
  analyzeDice: (imageUri: string) => {
    const form = new FormData();
    form.append('image', { uri: imageUri, name: 'dice.jpg', type: 'image/jpeg' } as unknown as Blob);
    return fetch(`${BASE_URL}/analyze/`, { method: 'POST', body: form }).then(r => r.json());
  },
};
