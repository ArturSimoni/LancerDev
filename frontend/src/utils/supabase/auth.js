import { supabase } from './client.js'

export async function signUp({ email, password, name, role }) {
  const { data, error } = await supabase.auth.signUp({ email, password }, { data: { name, role } })
  return { data, error }
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  return { data, error }
}

export async function getUser() {
  const { data, error } = await supabase.auth.getUser()
  return { data, error }
}
