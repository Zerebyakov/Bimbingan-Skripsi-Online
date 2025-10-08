import { createContext, useContext, useEffect, useState } from "react"
import { baseUrl } from "../components/api/myAPI";
import axios from "axios";

const AuthContext = createContext();
export const AuthProvider = ({children}) =>{
    const [user, setUser] = useState('');
    const [loading, setLoading] = useState('')

    const getMe = async () => {
        try {
            const res = await axios.get(`${baseUrl}auth/profile`,{
                withCredentials: true
            });
            setUser(res.data.data);
        } catch (error) {
            setUser(null)
        } finally {
            setLoading(false)
        }
    };

    const logout = async () => {
        try {
            await axios.post(`${baseUrl}auth/logout`,{
                withCredentials: true
            });
            setUser(null)
        } catch (error) {
            console.error('Logout Error', error)
        }
    };


    return (
        <AuthContext.Provider value={{user, setUser, getMe, loading, logout}}>
            {children}
        </AuthContext.Provider>
    )
}


export const useAuth = ()=> useContext(AuthContext);