import { VIEWS } from "./ViewConfig.js";
import { enableSearch } from "./search.js";

const filterState = {};
const filterCounts = {};

export async function renderView(viewKey, permissions) {
    const view = VIEWS[viewKey];
    if (!view) return;

    // reset current filter state
    for (const key of Object.keys(filterState)) delete filterState[key];
    for (const key of Object.keys(filterCounts)) delete filterCounts[key];

    for (const [key, filter] of Object.entries(view.filters)) {
        filterState[key] = [...filter.options];
        filterCounts[key] = filter.options.length;
    }

    // Set view action btn
    const oldActionBtnEl = document.querySelector('.nav-btn');
    const actionBtnEl = oldActionBtnEl.cloneNode(true);
    oldActionBtnEl.replaceWith(actionBtnEl);
    actionBtnEl.textContent = view.action.label;
    actionBtnEl.addEventListener('click', () => {
        view.action.handler();
    });

    // Populate nav tabs
    const navTabsEl = document.querySelector('.nav-tabs');
    navTabsEl.innerHTML = '';
    if (!navTabsEl) return;
    for (const view in VIEWS) {
        const tabEl = document.createElement('button');
        tabEl.type = 'button';
        tabEl.textContent = VIEWS[view].title;
        tabEl.className = 'nav-tab';

        tabEl.addEventListener('click', () => {
            renderView(view);
        });

        navTabsEl.appendChild(tabEl);
    }

    // Populate user name
    const usernameEl = document.querySelector('#user-name');
    if (!usernameEl) return;
    usernameEl.textContent = "PLACEHOLDER USERNAME";

    const filterFunc = buildFilterFunc(view.filters);

    // Populate sidebar filters
    const filterGroupsContainerEl = document.querySelector('#filter-groups');
    if (!filterGroupsContainerEl) return;
    filterGroupsContainerEl.innerHTML = '';

    for (const [key, filter] of Object.entries(view.filters)) {
        const filterGroupEl = document.createElement('div');
        filterGroupEl.className = 'filter-group';

        const filterTitleEl = document.createElement('div');
        filterTitleEl.className = 'filter-title';
        filterTitleEl.innerHTML = `<span>${filter.label}</span><svg class="chevron" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"></path></svg>`;
        filterTitleEl.addEventListener('click', () => {
            filterGroupEl.classList.toggle('open');
        });
        filterGroupEl.appendChild(filterTitleEl);

        const filterOptionsEl = document.createElement('div');
        filterOptionsEl.className = 'filter-options';

        for (const option of filter.options) {
            const label = document.createElement('label');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = option;
            checkbox.checked = true;
            checkbox.dataset.category = key;

            checkbox.addEventListener('change', (e) => {
                const value = e.target.value;
                const category = e.target.dataset.category;

                if (e.target.checked) {
                    filterState[category].push(value);
                } else {
                    filterState[category] = filterState[category].filter(v => v !== value);
                }

                table.setFilter(filterFunc);
            });

            label.append(checkbox, ' ', option);
            filterOptionsEl.append(label);
        }

        filterGroupEl.appendChild(filterOptionsEl);
        filterGroupsContainerEl.appendChild(filterGroupEl);
    }

    // Populate table
    const data = await view.getData;
    renderTable(table, view.columns, data);

    // Enable search
    const searchInput = document.getElementById('search-input');
    enableSearch(searchInput, table);
}

function renderTable(table, columns, data) {
    table.setColumns(columns);
    table.setData(data);
}

function parseRange(rangeStr) {
    if (rangeStr.startsWith('< '))  return { type: 'lt', val: parseFloat(rangeStr.slice(2)) };
    if (rangeStr.startsWith('> '))  return { type: 'gt', val: parseFloat(rangeStr.slice(2)) };
    const parts = rangeStr.split(' - ');
    if (parts.length === 2) return { type: 'between', lo: parseFloat(parts[0]), hi: parseFloat(parts[1]) };
    return null;
}

function matchesRange(value, rangeStr) {
    const r = parseRange(rangeStr);
    if (!r) return false;
    if (r.type === 'lt')      return value < r.val;
    if (r.type === 'gt')      return value >= r.val;
    if (r.type === 'between') return value >= r.lo && value <= r.hi;
    return false;
}

function buildFilterFunc(filters) {
    return function (data) {
        for (const [key, filter] of Object.entries(filters)) {
            const selected = filterState[key];
            if (!selected || selected.length >= filterCounts[key]) continue;

            const value = data[key];

            if (filter.type === 'range') {
                if (value == null || value === '') return false;
                if (!selected.some(r => matchesRange(value, r))) return false;
            } else {
                if (!selected.includes(String(value ?? ''))) return false;
            }
        }
        return true;
    };
}