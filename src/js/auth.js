const TOKEN_KEY = 'access_token';

export function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
    sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
    sessionStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated() {
    return !!getToken();
}

export async function login(email, password) {
    const response = await fetch(`/hydroiowa/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    setToken(data.access_token);
}

export function logout() {
    clearToken();
}