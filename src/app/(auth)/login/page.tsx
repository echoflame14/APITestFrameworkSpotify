'use client'; 
 
import { signIn } from 'next-auth/react'; 
 
export default function LoginPage() { 
  return ( 
    <div className="min-h-screen flex items-center justify-center bg-black"> 
      <div className="max-w-md w-full space-y-8 p-8"> 
        <div className="text-center"> 
          <h2 className="mt-6 text-3xl font-bold text-white">AI-Powered Music Player</h2> 
          <p className="mt-2 text-sm text-gray-400">Control your music through natural language</p> 
        </div> 
      </div> 
    </div> 
  ); 
} 
