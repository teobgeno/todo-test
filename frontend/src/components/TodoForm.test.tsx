import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { TodoForm } from './TodoForm';
import * as todosApi from '../api/todos';

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('TodoForm', () => {
  it('disables the Add button while the title is empty', () => {
    renderWithClient(<TodoForm />);

    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
  });

  it('does not call createTodo when submitting a whitespace-only title', () => {
    const createTodoSpy = vi.spyOn(todosApi, 'createTodo');
    renderWithClient(<TodoForm />);

    const input = screen.getByLabelText('New todo title');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(input.closest('form')!);

    expect(createTodoSpy).not.toHaveBeenCalled();
  });

  it('submits a trimmed title and clears the input on success', async () => {
    const createTodoSpy = vi.spyOn(todosApi, 'createTodo').mockResolvedValue({
      id: 1,
      title: 'Buy milk',
      completed: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const user = userEvent.setup();
    renderWithClient(<TodoForm />);

    const input = screen.getByLabelText('New todo title');
    await user.type(input, '  Buy milk  ');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(createTodoSpy).toHaveBeenCalledWith({ title: 'Buy milk' });
    await screen.findByDisplayValue('');
  });
});
