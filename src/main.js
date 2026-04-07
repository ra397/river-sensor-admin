import { renderView } from "./js/ViewManager.js";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import {VIEWS} from "./js/ViewConfig.js";
import { isAuthenticated, login, logout } from './js/auth.js';

const loginPage = document.querySelector('#login-container');
const mainPage = document.querySelector('#main');

function showLogin() {
    loginPage.style.display = 'flex';
    mainPage.style.display = 'none';
}

function showApp() {
    loginPage.style.display = 'none';
    mainPage.style.display = 'flex';
}

export const table = new Tabulator("#table", {
    height: '100%',
    layout: "fitColumns",
    pagination: true,
    paginationSize: 50,
    selectable: 1,
});

async function initApp() {
    const tableData = await VIEWS['observatories'].getData();
    await renderView('observatories', tableData);
}

// Login form handler
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    await login(email, password);
    showApp();
    await initApp();
});

// Logout handler
document.getElementById('logout-btn').addEventListener('click', () => {
    logout();
    showLogin();
});

// Entry point
if (isAuthenticated()) {
    console.log("Authenticated");
    showApp();
    await initApp();
} else {
    showLogin();
}