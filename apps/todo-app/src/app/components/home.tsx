import { Link } from 'react-router-dom';
import Signin from './signin';
import { useAuthState } from './authState';

export const Home = () => {
  const { authState } = useAuthState();

    return (
      <div className="">
        <h1 className="text-5xl text-center my-6">Ready to take on the day?</h1>
        <p className="text-center py-8">You won't miss a task with this fantastic Todo app - sign in and get tasking!</p>
        {!authState.isAuthenticated && <Signin />}
        {authState.isAuthenticated && <p className='text-center'>
          <Link to="/todo" className="underline">Where's my todos?</Link>
        </p>}
      </div>
    );
  }
  
  export default Home;