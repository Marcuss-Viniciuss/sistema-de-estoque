import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Mail, Lock, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Logo from '../components/Logo';

// Utility function for delay with exponential backoff - increased initial delay
const delay = (attempts: number) => new Promise(resolve => 
  setTimeout(resolve, Math.min(3000 * Math.pow(2, attempts), 15000))
);

// Retry function with adjusted parameters
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> {
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      return await operation();
    } catch (error: any) {
      attempts++;
      if (attempts === maxAttempts || 
          (!error?.message?.includes('rate limit') && 
           !error?.message?.includes('multiple (or no) rows returned'))) {
        throw error;
      }
      await delay(attempts);
    }
  }
  throw new Error('Max retry attempts reached');
}

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isResetMode, setIsResetMode] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    checkUser();
    // Increased initial delay before checking admin
    const timer = setTimeout(() => {
      checkAdminExists();
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.error('Error checking session:', err);
    } finally {
      setIsCheckingSession(false);
    }
  };

  const checkAdminExists = async () => {
    if (isCheckingSession) return; // Don't check if still checking session

    try {
      const adminEmail = 'uninassauadm@example.com';
      const adminPassword = 'GrupoSer082';
      const defaultCpf = '00000000000';

      // First check if admin exists in app_users
      const { data: existingAppUsers, error: appUserError } = await retryWithBackoff(() =>
        supabase
          .from('app_users')
          .select('*')
          .eq('cpf', defaultCpf)
      );

      if (appUserError) {
        throw appUserError;
      }

      // Handle multiple admin users case
      if (existingAppUsers && existingAppUsers.length > 1) {
        console.error('Multiple admin users found with the same CPF');
        setMessage('Conta de administrador já configurada. Por favor, faça login.');
        return;
      }

      // If admin user exists, verify their role and update if necessary
      if (existingAppUsers && existingAppUsers.length === 1) {
        const existingAppUser = existingAppUsers[0];
        if (existingAppUser.role !== 'admin') {
          const { error: updateError } = await retryWithBackoff(() =>
            supabase
              .from('app_users')
              .update({ role: 'admin' })
              .eq('id', existingAppUser.id)
          );

          if (updateError) throw updateError;
        }
        setMessage('Conta de administrador já configurada. Por favor, faça login.');
        return;
      }

      // Try to sign in with admin credentials
      const { data: signInData, error: signInError } = await retryWithBackoff(() =>
        supabase.auth.signInWithPassword({
          email: adminEmail,
          password: adminPassword,
        })
      );

      if (!signInError && signInData.user) {
        // Check if the user already exists in app_users with a different CPF
        const { data: existingUsers, error: existingUserError } = await retryWithBackoff(() =>
          supabase
            .from('app_users')
            .select('*')
            .eq('auth_user_id', signInData.user.id)
        );

        if (existingUserError) throw existingUserError;

        if (existingUsers && existingUsers.length > 0) {
          await supabase.auth.signOut();
          setMessage('Conta de administrador já configurada. Por favor, faça login.');
          return;
        }

        // Admin exists in auth but not in app_users
        const { error: insertError } = await retryWithBackoff(() =>
          supabase
            .from('app_users')
            .insert([
              {
                name: 'Administrador',
                email: adminEmail,
                cpf: defaultCpf,
                role: 'admin',
                auth_user_id: signInData.user.id,
              },
            ])
        );

        if (insertError) {
          if (insertError.message.includes('duplicate key')) {
            setMessage('Conta de administrador já configurada. Por favor, faça login.');
          } else {
            throw insertError;
          }
        } else {
          await supabase.auth.signOut();
          setMessage('Conta de administrador configurada. Por favor, faça login.');
        }
        return;
      }

      // If we reach here, we need to create a new admin user
      const { data: signUpData, error: signUpError } = await retryWithBackoff(() =>
        supabase.auth.signUp({
          email: adminEmail,
          password: adminPassword,
        })
      );

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setMessage('Conta de administrador já existe. Por favor, faça login.');
          return;
        }
        throw signUpError;
      }

      if (!signUpData.user) {
        throw new Error('No user data after signup');
      }

      // Create app_user for new admin
      const { error: createError } = await retryWithBackoff(() =>
        supabase
          .from('app_users')
          .insert([
            {
              name: 'Administrador',
              email: adminEmail,
              cpf: defaultCpf,
              role: 'admin',
              auth_user_id: signUpData.user.id,
            },
          ])
      );

      if (createError) {
        if (createError.message.includes('duplicate key')) {
          setMessage('Conta de administrador já configurada. Por favor, faça login.');
        } else {
          throw createError;
        }
      } else {
        setMessage('Conta de administrador configurada. Por favor, faça login.');
      }
    } catch (err: any) {
      console.error('Error in checkAdminExists:', err);
      if (err.message.includes('rate limit')) {
        setError('Muitas tentativas. Por favor, aguarde alguns segundos e tente novamente.');
      } else if (err.message.includes('duplicate key')) {
        setMessage('Conta de administrador já configurada. Por favor, faça login.');
      } else {
        setError('Erro ao configurar conta de administrador. Por favor, tente novamente mais tarde.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isResetMode) {
        const { error } = await retryWithBackoff(() =>
          supabase.auth.resetPasswordForEmail(email)
        );
        if (error) throw error;
        setMessage('Se o email existir, você receberá instruções para redefinir sua senha.');
        setIsResetMode(false);
      } else {
        const { data, error } = await retryWithBackoff(() =>
          supabase.auth.signInWithPassword({
            email,
            password,
          })
        );
        
        if (error) throw error;

        // Only navigate if we have a successful sign in
        if (data.session) {
          navigate('/', { replace: true });
        }
      }
    } catch (err: any) {
      if (err.message.includes('rate limit')) {
        setError('Muitas tentativas. Por favor, aguarde alguns segundos e tente novamente.');
      } else if (err.message.includes('Invalid login credentials')) {
        setError('Email ou senha inválidos');
      } else {
        setError('Ocorreu um erro ao fazer login. Por favor, tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isResetMode ? 'Recuperar Senha' : 'Entre na sua conta'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="form-input pl-10"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              </div>
            </div>

            {!isResetMode && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Senha
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="form-input pl-10"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
              </div>
            )}

            {error && (
              <div className="text-sm text-red-600 bg-red-50 rounded-md p-3">
                {error}
              </div>
            )}

            {message && (
              <div className="text-sm text-green-600 bg-green-50 rounded-md p-3">
                {message}
              </div>
            )}

            <div className="flex items-center justify-between">
              {!isResetMode && (
                <button
                  type="button"
                  onClick={() => setIsResetMode(true)}
                  className="text-sm text-primary hover:text-primary-dark"
                >
                  Esqueceu a senha?
                </button>
              )}
              {isResetMode && (
                <button
                  type="button"
                  onClick={() => setIsResetMode(false)}
                  className="text-sm text-primary hover:text-primary-dark flex items-center"
                >
                  <ArrowLeft size={16} className="mr-1" />
                  Voltar para login
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full flex justify-center items-center"
            >
              {loading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                  Processando...
                </span>
              ) : (
                <span className="flex items-center">
                  <KeyRound size={16} className="mr-2" />
                  {isResetMode ? 'Enviar instruções' : 'Entrar'}
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;