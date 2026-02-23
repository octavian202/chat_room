import React, { useState } from 'react';

interface LoginProps {
  onLogin: (username: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [name, setName] = useState('');

  const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onLogin(trimmed);
  };

  return (
    <div className="login">
      <h1>Chat Room</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          maxLength={50}
        />
        <button type="submit">Enter</button>
      </form>
    </div>
  );
}
