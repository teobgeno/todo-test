import { useTodosQuery } from '../hooks/useTodos';
import { TodoItem } from './TodoItem';

export function TodoList() {
  const { data: todos, isLoading, error } = useTodosQuery();

  if (isLoading) return <p>Loading todos...</p>;
  if (error) return <p role="alert">Failed to load todos: {error.message}</p>;
  if (!todos || todos.length === 0) return <p>No todos yet. Add one above.</p>;

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}
