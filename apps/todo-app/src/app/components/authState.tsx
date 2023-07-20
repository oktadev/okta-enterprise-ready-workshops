import { ReactNode, createContext, useCallback, useContext, useState } from 'react';

export interface AuthState {
  name: string | undefined;
  isAuthenticated: boolean;
}

const defaultAuthState: AuthState = {
  name: undefined,
  isAuthenticated: false
}

export type AuthContextType = {
  authState: AuthState;
  userIsAuthenticatedFn: () => Promise<void>;
  onAuthenticateFn: (username: string, password: string) => Promise<void>;
  onUsernameEnteredFn: (username: string) => Promise<number|null>;
  onRevokeAuthFn: () => Promise<void>;
}

const defaultAuthContext: AuthContextType = {
  authState: defaultAuthState,
  userIsAuthenticatedFn: async () => {},
  onAuthenticateFn: async () => {},
  onUsernameEnteredFn: async () => null,
  onRevokeAuthFn: async () => {}
}

const AuthContext = createContext<AuthContextType>(defaultAuthContext);
export const useAuthState = () => useContext(AuthContext);

type Props = {
  children: ReactNode;
}

const AuthContextProvider: React.FC<Props> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState);

  const userIsAuthenticatedFn = useCallback(async () => {
    const url = `/api/users/me`;
      try {
        const res = await fetch(url, {
            credentials: 'same-origin',
            mode: 'same-origin'
        });

        if (res.status === 200) {
          const {name} = await res.json();
          setAuthState({name, isAuthenticated: true});
          localStorage.setItem('isAuthenticated', 'true');
        } else {
          setAuthState(defaultAuthState);
          localStorage.setItem('isAuthenticated', 'false');
        }
      } catch (error: unknown) {
        setAuthState(defaultAuthState);
        console.error(error);
      }
  }, [setAuthState]);

  const onAuthenticateFn = async (username: string, password: string) => { 
    const url = `/api/signin`;
    try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });

        const {name} = await res.json();

        setAuthState({name, isAuthenticated: true})
        localStorage.setItem('isAuthenticated', 'true');
      } catch (error: unknown) {
        console.error(error);
      }
  }

  const onUsernameEnteredFn = async (username: string) => {
    const url = `/api/openid/check`;
    try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username })
        });

        const {org_id} = await res.json();

        return org_id;
      } catch (error: unknown) {
        console.error(error);
      }

    return null;
  }

  const onRevokeAuthFn = async () => {
    const url = `/api/signout`;
    try {
        const res = await fetch(url, {
          method: 'POST'
        });
        
        setAuthState(defaultAuthState);
        localStorage.setItem('isAuthenticated', 'false');
      } catch (error: unknown) {
        console.error(error);
    }
  }

  return <AuthContext.Provider value={{ authState, onAuthenticateFn, onUsernameEnteredFn, onRevokeAuthFn, userIsAuthenticatedFn }}>{children}</AuthContext.Provider>;
};

export default AuthContextProvider;
