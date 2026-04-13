import { renderView } from "./js/ViewManager.js";
import {VIEWS} from "./js/ViewConfig.js";
import {isAuthenticated, login, logout, requestOneTimeCode, submitNewPassword} from './js/auth.js';
import './js/plotly.js';

const loginPage = document.querySelector('#login-container');
const forgotPasswordPage = document.querySelector('#forgot-password-container');
const newPasswordPage = document.querySelector('#new-password-container');
const mainPage = document.querySelector('#main');

function showLogin() {
    loginPage.style.display = 'flex';
    forgotPasswordPage.style.display = 'none';
    newPasswordPage.style.display = 'none';
    mainPage.style.display = 'none';
}

function showForgotPassword() {
    loginPage.style.display = 'none';
    forgotPasswordPage.style.display = 'flex';
    newPasswordPage.style.display = 'none';
    mainPage.style.display = 'none';
}

function showNewPassword(email) {
    loginPage.style.display = 'none';
    forgotPasswordPage.style.display = 'none';
    newPasswordPage.style.display = 'flex';
    mainPage.style.display = 'none';
    document.getElementById('reset-email').value = email;
}

function showApp() {
    loginPage.style.display = 'none';
    forgotPasswordPage.style.display = 'none';
    newPasswordPage.style.display = 'none';
    mainPage.style.display = 'flex';
}

async function initApp() {
    const tableData = await VIEWS['observatories'].getData();
    await renderView('observatories', tableData);
}

// Login form handler
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        await login(email, password);
        showApp();
        await initApp();
    } catch {
        alert('Invalid email or password');
    }
});

// Logout handler
document.getElementById('logout-btn').addEventListener('click', () => {
    logout();
    showLogin();
});

// Forgot password handlers
document.getElementById('forgot-password-link').addEventListener('click', () => {
    showForgotPassword();
});

document.querySelectorAll('.back-to-login').forEach(el => {
    el.addEventListener('click', () => showLogin());
});

document.getElementById('get-otp-btn').addEventListener('click', async () => {
    const email = document.getElementById('forgot-email').value.toLowerCase().trim();
    try {
        await requestOneTimeCode(email);
        showNewPassword(email);
    } catch {
        alert('Failed to send one-time code. Please try again.');
    }
});

document.getElementById('reset-password-btn').addEventListener('click', async () => {
    const email = document.getElementById('reset-email').value.toLowerCase().trim();
    const oneTimeCode = document.getElementById('reset-otp').value;
    const password = document.getElementById('reset-password').value;
    const passwordConfirm = document.getElementById('reset-password-confirm').value;

    if (password !== passwordConfirm) {
        alert('Passwords do not match.');
        return;
    }

    try {
        await submitNewPassword(email, oneTimeCode, password);
        showLogin();
        alert("Successfully reset password");
    } catch {
        alert('Failed to reset password. Please try again.');
    }
});

// Entry point
if (isAuthenticated()) {
    showApp();
    await initApp();
} else {
    showLogin();
}