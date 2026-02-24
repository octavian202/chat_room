import React, { useState } from 'react';

interface LoginProps {
  onLogin: (username: string) => void;
}

const MAX_NAME_LENGTH = 100;

export default function Login({ onLogin }: LoginProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter your name.');
      return;
    }
    if (trimmed.length > MAX_NAME_LENGTH) {
      setError(`Name must not exceed ${MAX_NAME_LENGTH} characters.`);
      return;
    }
    onLogin(trimmed);
  };

  return (
    <div className="login">
      <h1>Chat Room</h1>
      {error && (
        <div id="login-error" className="form-error" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          autoFocus
          maxLength={MAX_NAME_LENGTH}
          aria-invalid={!!error}
          aria-describedby={error ? 'login-error' : undefined}
        />
        <button type="submit">Enter</button>
      </form>
    </div>
  );
}
