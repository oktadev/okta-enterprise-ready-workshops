// eslint-disable-next-line @typescript-eslint/no-unused-vars
import styles from './app.module.scss';

import { Route, Routes } from 'react-router-dom';
import Todo from './components/todolist';
import { useAuthState } from './components/authState';
import Home from './components/home';
import Toolbar from './components/toolbar';
import Profile from './components/profile';
import { useEffect } from 'react';

export const App = () => {
  const { userIsAuthenticatedFn, authState } = useAuthState();

  useEffect(() => {
    userIsAuthenticatedFn();
  }, [userIsAuthenticatedFn]);

  return (
    <div className="m-3">
      <Toolbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />}/>
          <Route path="/todo" element={<Todo />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
