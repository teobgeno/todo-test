import { TodoForm } from './components/TodoForm'
import { TodoList } from './components/TodoList'
// test 9
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
