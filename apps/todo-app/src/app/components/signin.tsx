import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from './authState';

export const Signin = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const { onAuthenticateFn, onUsernameEnteredFn } = useAuthState();
  const navigate = useNavigate();

  const onAuthenticate = async () => { 
    const signIn = async () => {

      // When the user enters just their email, but no password, check if the email is part of an org
      if (username && !password) {
        const org_id = await onUsernameEnteredFn(username);
        if(org_id) {
          window.location.assign(`http://localhost:3333/openid/start/${org_id}`)
          return;
        } else {
          document.getElementById('password-field')?.removeAttribute('hidden');
          return;
        }
      }

      if (username && password) {
        await onAuthenticateFn(username, password);
      }
      setUsername('');
      setPassword('');

      navigate('/todo');
    };
    signIn();
  };

    return (
      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="mb-6">
          <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full text-slate-900 placeholder-slate-400 rounded-md py-2 pl-2 ring-1 ring-slate-200"
            value={username}
            onChange={(event) => setUsername(event.currentTarget.value)}
          />
        </div>
        
        <div id="password-field" className="mb-6" hidden>
          <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
            Password
          </label>
          <input
            id="password"
            name="email"
            type="password"
            autoComplete="current-password"
            required
            className="w-full text-slate-900 placeholder-slate-400 rounded-md py-2 pl-2 ring-1 ring-slate-200"
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
          />
        </div>
        <button 
            className="w-full py-2 px-3 bg-slate-300 rounded-md"
            onClick={onAuthenticate}
            disabled = {!username}
          >
            Sign in
          </button>
      </div>
    );
  }
  
  export default Signin;
