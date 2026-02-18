import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StitchButton } from '../../components/common/StitchButton';
import { StitchInput } from '../../components/common/StitchInput';
import { StitchCard } from '../../components/common/StitchCard';
import { StitchFlex } from '../../components/common/StitchLayout';
import { ShoppingBag, Github, Mail, User, Lock } from 'lucide-react';

const RegisterScreen: React.FC = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Register attempt:', { name, email, password });
        // Mock register and redirect
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <StitchFlex justify="center" className="mb-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                            <ShoppingBag size={24} />
                        </div>
                    </StitchFlex>
                    <h1 className="text-3xl font-bold text-slate-900">Create an account</h1>
                    <p className="text-slate-500 mt-2">Start designing your next big idea.</p>
                </div>

                <StitchCard className="p-8">
                    <form onSubmit={handleRegister} className="space-y-5">
                        <StitchInput
                            label="Full Name"
                            type="text"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            icon={<User size={16} />}
                        />

                        <StitchInput
                            label="Email"
                            type="email"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            icon={<Mail size={16} />}
                        />

                        <StitchInput
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            icon={<Lock size={16} />}
                        />

                        <StitchButton type="submit" className="w-full" size="lg">
                            Sign Up
                        </StitchButton>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <StitchButton type="button" variant="secondary" leftIcon={<Github size={18} />}>
                                GitHub
                            </StitchButton>
                            <StitchButton type="button" variant="secondary" leftIcon={<span className="font-bold">G</span>}>
                                Google
                            </StitchButton>
                        </div>
                    </form>
                </StitchCard>

                <p className="text-center mt-6 text-sm text-slate-500">
                    Already have an account?{' '}
                    <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                        Sign in
                    </a>
                </p>
            </div>
        </div>
    );
};

export default RegisterScreen;
