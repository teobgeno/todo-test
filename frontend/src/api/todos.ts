import { apiFetch } from './client';
import type { Todo } from '../types/todo';

export interface CreateTodoInput {
  title: string;
}

export interface UpdateTodoInput {
  title?: string;
  completed?: boolean;
}

export function getTodos(): Promise<Todo[]> {
  return apiFetch<Todo[]>('/todos');
}

export function createTodo(input: CreateTodoInput): Promise<Todo> {
  return apiFetch<Todo>('/todos', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateTodo(id: number, input: UpdateTodoInput): Promise<Todo> {
  return apiFetch<Todo>(`/todos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteTodo(id: number): Promise<void> {
  return apiFetch<void>(`/todos/${id}`, { method: 'DELETE' });
}
