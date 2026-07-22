import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Todo } from '../types/todo';
import { useDeleteTodoMutation, useUpdateTodoMutation } from '../hooks/useTodos';

interface TodoItemProps {
  todo: Todo;
}

export function TodoItem({ todo }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(todo.title);
  const updateTodo = useUpdateTodoMutation();
  const deleteTodo = useDeleteTodoMutation();

  function startEditing() {
    setDraftTitle(todo.title);
    setIsEditing(true);
  }

  function commitEdit() {
    setIsEditing(false);
    const trimmed = draftTitle.trim();
    if (!trimmed || trimmed === todo.title) return;
    updateTodo.mutate({ id: todo.id, input: { title: trimmed } });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    } else if (event.key === 'Escape') {
      setDraftTitle(todo.title);
      setIsEditing(false);
    }
  }

  return (
    <li className="todo-item">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={(event) =>
          updateTodo.mutate({ id: todo.id, input: { completed: event.target.checked } })
        }
        aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
      />
      {isEditing ? (
        <input
          className="todo-item-edit"
          value={draftTitle}
          onChange={(event) => setDraftTitle(event.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          autoFocus
          aria-label="Edit todo title"
        />
      ) : (
        <span
          className={todo.completed ? 'todo-item-title completed' : 'todo-item-title'}
          onClick={startEditing}
        >
          {todo.title}
        </span>
      )}
      <button
        type="button"
        className="todo-item-delete"
        onClick={() => deleteTodo.mutate(todo.id)}
        aria-label={`Delete "${todo.title}"`}
      >
        Delete
      </button>
    </li>
  );
}
