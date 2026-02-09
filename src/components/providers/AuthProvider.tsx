"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import { useMutation, useQuery } from "convex/react";
import { api, Id } from "@/lib/convex";

interface User {
    _id: Id<"users">;
    email: string;
    name?: string;
    credits: number;
    createdAt: number;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    signUp: (email: string, password: string, name?: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "peargent_echo_token";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const signUpMutation = useMutation(api.auth.signUp);
    const signInMutation = useMutation(api.auth.signInWithPassword);
    const signOutMutation = useMutation(api.auth.signOutWithToken);

    // Load token from localStorage on mount
    useEffect(() => {
        const savedToken = localStorage.getItem(TOKEN_KEY);
        if (savedToken) {
            setToken(savedToken);
        }
        setIsLoading(false);
    }, []);

    // Query current user when token changes
    const user = useQuery(
        api.auth.getCurrentUser,
        token ? { token } : "skip"
    );

    const signUp = async (email: string, password: string, name?: string) => {
        const result = await signUpMutation({ email, password, name });
        localStorage.setItem(TOKEN_KEY, result.token);
        setToken(result.token);
    };

    const signIn = async (email: string, password: string) => {
        const result = await signInMutation({ email, password });
        localStorage.setItem(TOKEN_KEY, result.token);
        setToken(result.token);
    };

    const signOut = async () => {
        if (token) {
            await signOutMutation({ token });
        }
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
    };

    // Handle null user (invalid/expired token)
    useEffect(() => {
        if (token && user === null && !isLoading) {
            // Token is invalid, clear it
            localStorage.removeItem(TOKEN_KEY);
            setToken(null);
        }
    }, [token, user, isLoading]);

    return (
        <AuthContext.Provider
            value={{
                user: user as User | null,
                isLoading: isLoading || (token !== null && user === undefined),
                signUp,
                signIn,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
