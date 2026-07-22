import { TodoForm } from './components/TodoForm'
import { TodoList } from './components/TodoList'

function App() {
  return (
    <main className="app">
      <h1>Todos</h1>
      <TodoForm />
      <TodoList />
    </main>
  )
}

export default App
