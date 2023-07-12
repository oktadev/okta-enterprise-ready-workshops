import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from './authState';

interface ITodo {
  id: number;
  task: string;
  completed: boolean;
}

export const Todos = () => {
  const [todoList, setTodoList] = useState<ITodo[]>([]);
  const [newTask, setNewTask] = useState<string>('');
  const { authState } = useAuthState();
  const navigate = useNavigate();

  const API_BASE_URL = '/api/todos';

  const onNewTask = () => { 
    const apiCall = async () => {
      try {
        const res = await fetch(API_BASE_URL, {
          method: 'POST',
          credentials: 'same-origin',
          mode: 'same-origin',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ task: newTask })
        });

        const todo = await res.json();
        setTodoList([...todoList, todo]);
        setNewTask('');
      } catch (error: unknown) {
        console.error(error);
      }
    };
    apiCall();
  };

  const onChangeTaskStatus = (todo: ITodo) => {
    const {completed} = todo;
    const url = `${API_BASE_URL}/${todo.id}`;
    const apiCall = async () => {
      try {
        const res = await fetch(url, {
          method: 'PUT',
          credentials: 'same-origin',
          mode: 'same-origin',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({...todo, completed: !completed})
        });
        const updatedTodo = await res.json();
      
        setTodoList([...todoList.filter(t => t.id !== todo.id), updatedTodo]);
      } catch (error: unknown) {
        console.error(error);
      }
    };

    apiCall();
  };

  const onDeleteTask = (todo: ITodo) => {
    const url = `${API_BASE_URL}/${todo.id}`

    const apiCall = async () => {
      try {
        await fetch(url, {
          method: 'DELETE',
          credentials: 'same-origin',
          mode: 'same-origin'
        });
        setTodoList(todoList.filter(t => t.id !== todo.id));
      } catch (error: unknown) {
        console.error(error);
      }
    };

    apiCall();
  };

  const todoItems = todoList.map(todo => 
      <li key={todo.id} className="p-3 flex justify-between" >
      <div className="flex">
        <input type="checkbox" 
          id={`check-${todo.id}`} 
          className="mr-3 w-4 h-6" 
          checked = {todo.completed}
          onChange={() => onChangeTaskStatus(todo)} 
        />
        <label htmlFor={`check-${todo.id}`}>{todo.task}</label>
      </div>
      <button 
        className="rounded-full p-2 hover:shadow-md" 
        onClick={() => onDeleteTask(todo)}
      >
        <svg className="h-7 fill-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 96 960 960"><path d="M261 936q-24.75 0-42.375-17.625T201 876V306h-41v-60h188v-30h264v30h188v60h-41v570q0 24-18 42t-42 18H261Zm438-630H261v570h438V306ZM367 790h60V391h-60v399Zm166 0h60V391h-60v399ZM261 306v570-570Z"/></svg>
      </button>
    </li>
  );

  useEffect(() => {
    const getTodos = async () => {
      try {
        const response = await fetch(API_BASE_URL, {
          credentials: 'same-origin',
          mode: 'same-origin'
      });
        const res  = await response.json();
        setTodoList(res.todos);
      } catch (error: unknown) {
        console.error(error);
      }
    };

    if (authState.isAuthenticated) {
      getTodos();
    } else {
      navigate('/');
    }
  }, [setTodoList]);

    return (
      <div>
        {authState.isAuthenticated && <>
          <h1 className="text-5xl text-center my-6">What's on your plate?</h1>
        <div className="w-7/12 mx-auto shadow bg-white rounded-md">
          <div className="mb-6 px-8 py-6">
            <input
              className="w-4/5 text-sm text-slate-900 placeholder-slate-400 rounded-md py-2 pl-2 ring-1 ring-slate-200" 
              type="text" 
              placeholder="Add a new task" 
              value={newTask}
              onChange={(event) => setNewTask(event.currentTarget.value)}
            />
            <button 
              className="ml-6 py-2 px-3 bg-slate-300 rounded-md" 
              onClick={onNewTask}
              disabled = {!newTask}
            >
              Save
            </button>
          </div>
          {todoList.length > 0 && <div className="bg-slate-50 px-4 py-3">
            <ul className="w-4/5">
              {todoItems}
            </ul>
          </div>}
          {todoList.length === 0 && <p className="text-slate-600 text-center py-3">Add a task to get started</p>}
        </div>
        </>}
      </div>
    );
  }
  
  export default Todos;