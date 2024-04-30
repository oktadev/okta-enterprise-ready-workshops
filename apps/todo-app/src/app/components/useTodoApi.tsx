import { useNavigate } from "react-router";
import { useAuthState } from './authState';

export const useTodoApi = () => {
    const navigate = useNavigate()    // from react-router
    const { resetAuthState } = useAuthState();
    async function useApi(url: RequestInfo | URL, data = {}): Promise<Response> {
        const res = await fetch(url, data);
        if (!res.ok) {
            if (res.status === 401) {
                // Set user's authentication state to false
                resetAuthState()
                // Redirect user to login
                navigate("/");
            }
            else {
                // Handle other errors
                throw new Error('Error occurred while fetching data');
            }
        }
        return res
    }
    return useApi;
}

export default useTodoApi;