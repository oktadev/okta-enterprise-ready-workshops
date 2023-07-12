import { useNavigate } from 'react-router-dom';
import { useAuthState } from './authState';
import { useEffect, useState } from 'react';

export const Profile = () => {

  const { authState } = useAuthState();
  const [user, setUser] = useState<object>({});
  const navigate = useNavigate();

  useEffect(() => {
    const getUserProfile = async () => {
      try {
        const response = await fetch('/api/users/me', {
          credentials: 'same-origin',
          mode: 'same-origin'
      });
        const res  = await response.json();
        setUser(res);
      } catch (error: unknown) {
        console.error(error);
      }
    };

    if (authState.isAuthenticated) {
      getUserProfile();
    } else {
      navigate('/');
    }
  }, [setUser]);

  const userData = Object.entries(user).map(([key, value], index) => 
    <li key={key} className={index % 2 === 0 ? "table-row bg-slate-50": "table-row"}>
    <span className="pl-3 py-2 table-cell">
      {key}
    </span>
    <span className="table-cell">
      {value}
    </span>
  </li>
);

    return (
      <>
        {authState.isAuthenticated && <div>
          <h1 className="text-5xl text-center my-6">About you</h1>
          <ul className="mx-auto w-2/5 border border-slate-200 rounded-md shadow-sm px-2 py-2 table">
            {userData}
          </ul>
        </div>}
      </>
    );
  }
  
  export default Profile;