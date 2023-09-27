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

      window.location.assign(`http://localhost:3333/openid/start`)
      return;

    };
    signIn();
  };

    return (
      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <button
            className="w-full py-2 px-3 bg-slate-300 rounded-md"
            onClick={onAuthenticate}
          >
            Sign in
          </button>
      </div>
    );
  }
  
  export default Signin;
