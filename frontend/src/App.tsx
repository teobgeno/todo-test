import { useQuery } from '@tanstack/react-query'
import { getTodos } from './api/todos'

// Temporary placeholder to verify the API layer end-to-end.
// Phase 6 replaces this with TodoForm/TodoList/TodoItem.
function App() {
  const { data: todos, isLoading, error } = useQuery({
    queryKey: ['todos'],
    queryFn: getTodos,
  })

  if (isLoading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>

  return <pre>{JSON.stringify(todos, null, 2)}</pre>
}

export default App
