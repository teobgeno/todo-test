import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { TodoItem } from './TodoItem';
import * as todosApi from '../api/todos';
import type { Todo } from '../types/todo';

const sampleTodo: Todo = {
  id: 1,
  title: 'Buy milk',
  completed: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('TodoItem', () => {
  it('calls updateTodo with completed: true when the checkbox is checked', async () => {
    const updateTodoSpy = vi
      .spyOn(todosApi, 'updateTodo')
      .mockResolvedValue({ ...sampleTodo, completed: true });
    const user = userEvent.setup();
    renderWithClient(<TodoItem todo={sampleTodo} />);

    await user.click(screen.getByRole('checkbox'));

    expect(updateTodoSpy).toHaveBeenCalledWith(1, { completed: true });
  });

  it('calls deleteTodo with the todo id when Delete is clicked', async () => {
    const deleteTodoSpy = vi.spyOn(todosApi, 'deleteTodo').mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithClient(<TodoItem todo={sampleTodo} />);

    await user.click(screen.getByRole('button', { name: 'Delete "Buy milk"' }));

    expect(deleteTodoSpy).toHaveBeenCalledWith(1);
  });
});
