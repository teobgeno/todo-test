import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTodo, deleteTodo, getTodos, updateTodo } from '../api/todos';
import type { CreateTodoInput, UpdateTodoInput } from '../api/todos';

const TODOS_QUERY_KEY = ['todos'];

export function useTodosQuery() {
  return useQuery({ queryKey: TODOS_QUERY_KEY, queryFn: getTodos });
}

export function useCreateTodoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTodoInput) => createTodo(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY }),
  });
}

export function useUpdateTodoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateTodoInput }) => updateTodo(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY }),
  });
}

export function useDeleteTodoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTodo(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY }),
  });
}
