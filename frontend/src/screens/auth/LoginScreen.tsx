import React, { useState } from 'react';
import { StitchButton } from '../../components/common/StitchButton';
import { StitchInput } from '../../components/common/StitchInput';
import { StitchCard } from '../../components/common/StitchCard';
import { StitchFlex } from '../../components/common/StitchLayout';
import { ShoppingBag, Github, Mail } from 'lucide-react'; // Assuming lucide-react is installed or similar icons

const LoginScreen: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Login attempt:', { email, password });
        // Navigate to dashboard (mock)
        window.location.href = '/dashboard';
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
                    <h1 className="text-3xl font-bold text-slate-900">Welcome back</h1>
                    <p className="text-slate-500 mt-2">Enter your details to access your workspace.</p>
                </div>

                <StitchCard className="p-8">
                    <form onSubmit={handleLogin} className="space-y-5">
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
                        />

                        <StitchFlex justify="between" className="text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                <span className="text-slate-600">Remember me</span>
                            </label>
                            <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">Forgot password?</a>
                        </StitchFlex>

                        <StitchButton type="submit" className="w-full" size="lg">
                            Sign In
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
                    Don't have an account?{' '}
                    <a href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                        Sign up for free
                    </a>
                </p>
            </div>
        </div>
    );
};

export default LoginScreen;
