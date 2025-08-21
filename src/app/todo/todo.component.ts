import { Component, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type Todo = { id: string; title: string; done: boolean; createdAt: number };

@Component({
  selector: 'app-todo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './todo.component.html',
  styleUrls: ['./todo.component.css'],
})
export class TodoComponent {
  // ---- 狀態 ----
  todos = signal<Todo[]>([]);
  newTitle = signal('');
  editingId = signal<string | null>(null);
  keyword = signal('');
  filter = signal<'all' | 'active' | 'done'>('all');

  // 讀取 LocalStorage（先載入，再建立 effect 避免覆寫）
  constructor() {
    const raw = localStorage.getItem('todos');
    if (raw) {
      try { this.todos.set(JSON.parse(raw)); } catch {}
    }
    // 任一變化就存檔
    effect(() => {
      localStorage.setItem('todos', JSON.stringify(this.todos()));
    });
  }

  // ---- 衍生資料 ----
  filtered = computed(() => {
    const k = this.keyword().trim().toLowerCase();
    const f = this.filter();
    return this.todos().filter(t => {
      const byText = !k || t.title.toLowerCase().includes(k);
      const byState = f === 'all' ? true : f === 'active' ? !t.done : t.done;
      return byText && byState;
    });
  });
  leftCount = computed(() => this.todos().filter(t => !t.done).length);
  completedCount = computed(() => this.todos().filter(t => t.done).length);
  allChecked = computed(() => this.todos().length > 0 && this.leftCount() === 0);

  // ---- 事件 ----
  add() {
    const title = this.newTitle().trim();
    if (!title) return;
    this.todos.update(list => [
      ...list,
      { id: cryptoRandomId(), title, done: false, createdAt: Date.now() },
    ]);
    this.newTitle.set('');
  }

  toggle(id: string) {
    this.todos.update(list => list.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }

  startEdit(id: string) {
    const t = this.todos().find(x => x.id === id);
    if (!t) return;
    this.editingId.set(id);
    this.newTitle.set(t.title);
  }

  confirmEdit(id: string) {
    const title = this.newTitle().trim();
    if (!title) { this.remove(id); return; }
    this.todos.update(list => list.map(t => t.id === id ? { ...t, title } : t));
    this.editingId.set(null);
    this.newTitle.set('');
  }

  cancelEdit() {
    this.editingId.set(null);
    this.newTitle.set('');
  }

  remove(id: string) {
    this.todos.update(list => list.filter(t => t.id !== id));
  }

  clearCompleted() {
    this.todos.update(list => list.filter(t => !t.done));
  }

  toggleAll() {
    const allDone = this.allChecked();
    this.todos.update(list => list.map(t => ({ ...t, done: !allDone })));
  }

  // 給 *ngFor 的 trackBy
  trackById(index: number, item: { id: string }) {
    return item.id;
  }
}

// 簡單隨機 id（支援舊瀏覽器）
function cryptoRandomId() {
  const g = (globalThis as any);
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
