import { VIEWS } from "./ViewConfig.js";
import { enableSearch } from "./search.js";

export const filterState = {
    status: ["active", "defective", "retired", "suspended"],
    rate: ['2', '3', '4', '5'],
    firmware: ['0.6', '0.86', '0.88', '0.89', '0.90', '1.00', '1.01', '6.1'],
    no_pckt_days: ["< 7", "7 - 14", "> 14"],
    voltage: ["< 10", "10 - 11", "11 - 12", "12 - 13", "> 13"],
};

export const filterCounts = Object.fromEntries(
    Object.entries(filterState).map(([key, vals]) => [key, vals.length])
);

export async function renderView(viewKey, permissions) {
    const view = VIEWS[viewKey];
    if (!view) return;

    // Set view title
    const titleEl = document.querySelector('.nav-title');
    if (!titleEl) return;
    titleEl.textContent = view.title;

    // Set view action btn
    const actionBtnEl = document.querySelector('.nav-btn');
    if (!actionBtnEl) return;
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

    // Populate sidebar filters
    const filterGroupsContainerEl = document.querySelector('#filter-groups');
    if (!filterGroupsContainerEl) return;
    filterGroupsContainerEl.innerHTML = '';

    for (const [key, filter] of Object.entries(view.filters)) {
        const filterGroupEl = document.createElement('div');
        filterGroupEl.className = 'filter-group';

        const filterTitleEl = document.createElement('span');
        filterTitleEl.className = 'filter-title';
        filterTitleEl.textContent = filter.label;
        filterGroupEl.appendChild(filterTitleEl);

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
            filterGroupEl.append(label);
        }
        filterGroupsContainerEl.appendChild(filterGroupEl);
    }

    // Populate table
    const data = await view.getData;
    renderTable(table, view.columns, data);
    const filterFunc = buildFilterFunc(view.filters);

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