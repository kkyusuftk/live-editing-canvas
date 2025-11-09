import { AuthError, Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { supabase } from "../lib/supabase";

interface AuthState {
	session: Session | null;
	user: User | null;
	loading: boolean;
	initialized: boolean;
	signIn: (
		email: string,
		password: string,
	) => Promise<{ error: AuthError | null }>;
	signUp: (
		email: string,
		password: string,
		username: string,
	) => Promise<{ error: AuthError | null }>;
	signOut: () => Promise<void>;
	initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
	session: null,
	user: null,
	loading: true,
	initialized: false,

	initialize: async () => {
		try {
			// Get initial session
			const {
				data: { session },
			} = await supabase.auth.getSession();
			set({
				session,
				user: session?.user ?? null,
				loading: false,
				initialized: true,
			});

			// Listen for auth changes
			supabase.auth.onAuthStateChange((_event, session) => {
				set({ session, user: session?.user ?? null, loading: false });
			});
		} catch (error) {
			console.error("Error initializing auth:", error);
			set({ loading: false, initialized: true });
		}
	},

	signIn: async (email: string, password: string) => {
		set({ loading: true });
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});
		set({ loading: false });
		return { error };
	},

	signUp: async (email: string, password: string, username: string) => {
		set({ loading: true });
		const { error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					username,
				},
			},
		});
		set({ loading: false });
		return { error };
	},

	signOut: async () => {
		set({ loading: true });
		await supabase.auth.signOut();
		set({ session: null, user: null, loading: false });
	},
}));
