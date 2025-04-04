import { useContext, createContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

const AuthContext = createContext();

// eslint-disable-next-line react/prop-types
const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({
        user: null,
        token: "",
    });
    const [isAdmin, setIsAdmin] = useState(false);
    const [isContextLoading, setIsContextLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = () => {
            try {
                const data = Cookies.get("auth");
                console.log("Auth cookie found:", data ? "Yes" : "No");
                
                if (data) {
                    const parsedData = JSON.parse(data);
                    console.log("Parsed auth data:", parsedData);
                    
                    // Validate the parsed data has the required fields
                    if (parsedData && parsedData.user && parsedData.token) {
                        console.log("Setting auth state from cookie");
                        setAuth({
                            user: parsedData.user,
                            token: parsedData.token,
                        });
                        
                        // Explicitly check if role is 1 for admin
                        const isUserAdmin = parsedData.user.role === 1;
                        console.log("User role:", parsedData.user.role, "Is admin:", isUserAdmin);
                        setIsAdmin(isUserAdmin);
                    } else {
                        console.error("Invalid auth data in cookie - missing required fields");
                        Cookies.remove("auth");
                    }
                } else {
                    console.log("No auth cookie found");
                }
            } catch (error) {
                console.error("Error initializing auth:", error);
                // Clear invalid cookie data
                Cookies.remove("auth");
            } finally {
                setIsContextLoading(false);
            }
        };

        initializeAuth();
    }, []);

    //Function to Logout user
    const LogOut = () => {
        setAuth({
            user: null,
            token: "",
        });
        setIsAdmin(false);
        Cookies.remove("auth");
        toast.success("Logged out Successfully!", {
            toastId: "LogOut",
        });
    };

    return (
        <AuthContext.Provider
            value={{ auth, setAuth, LogOut, isAdmin, isContextLoading }}
        >
            {children}
        </AuthContext.Provider>
    );
};

//custom hook->
const useAuth = () => {
    return useContext(AuthContext);
};

// eslint-disable-next-line react-refresh/only-export-components
export { AuthProvider, useAuth };
