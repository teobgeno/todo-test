import { useState } from 'react';
import type { FormEvent } from 'react';
import { useCreateTodoMutation } from '../hooks/useTodos';

export function TodoForm() {
  const [title, setTitle] = useState('');
  const createTodo = useCreateTodoMutation();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    createTodo.mutate({ title: trimmed }, { onSuccess: () => setTitle('') });
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="What needs to be done?"
        aria-label="New todo title"
      />
      <button type="submit" disabled={createTodo.isPending || !title.trim()}>
        Add
      </button>
    </form>
  );
}
