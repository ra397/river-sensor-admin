import { table } from "../main.js";
import { VIEWS } from "./ViewConfig.js";
import { enableSearch } from "./search.js";
import { openModal } from "./ModalManager.js";

const filterState = {};
const filterCounts = {};

function resetFilterState(filters) {
    for (const key of Object.keys(filterState)) delete filterState[key];
    for (const key of Object.keys(filterCounts)) delete filterCounts[key];

    for (const [key, filter] of Object.entries(filters)) {
        filterState[key] = [...filter.options];
        filterCounts[key] = filter.options.length;
    }
}

function renderNavbar(viewKey) {
    const navTabsEl = document.querySelector('.nav-tabs');
    if (!navTabsEl) return;
    navTabsEl.innerHTML = '';

    for (const key in VIEWS) {
        const tabEl = document.createElement('button');
        tabEl.type = 'button';
        tabEl.textContent = VIEWS[key].title;
        tabEl.className = 'nav-tab';
        if (key === viewKey) tabEl.classList.add('active');
        tabEl.addEventListener('click', async () => {
            const tableData = await VIEWS[key].getData();
            await renderView(key, tableData);
        });
        navTabsEl.appendChild(tabEl);
    }
}

function renderActionButton(view) {
    const oldBtn = document.querySelector('#nav-action-btn');
    const btn = oldBtn.cloneNode(true);
    oldBtn.replaceWith(btn);
    btn.textContent = view.action.label;
    btn.addEventListener('click', () => view.action.handler());
}

function renderFilters(view) {
    const container = document.querySelector('#filter-groups');
    if (!container) return;
    container.innerHTML = '';

    const filterFunc = buildFilterFunc(view.filters);

    for (const [key, filter] of Object.entries(view.filters)) {
        const groupEl = document.createElement('div');
        groupEl.className = 'filter-group';

        const titleEl = document.createElement('div');
        titleEl.className = 'filter-title';
        titleEl.innerHTML = `<span>${filter.label}</span><svg class="chevron" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"></path></svg>`;
        titleEl.addEventListener('click', () => groupEl.classList.toggle('open'));
        groupEl.appendChild(titleEl);

        const optionsEl = document.createElement('div');
        optionsEl.className = 'filter-options';

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
            optionsEl.append(label);
        }

        groupEl.appendChild(optionsEl);
        container.appendChild(groupEl);
    }
}

function renderColumnToggles(view) {
    const container = document.querySelector('#column-toggle-container');
    if (!container) return;
    container.innerHTML = '';

    for (const column of view.columns) {
        if (column.visible === false) continue;
        const btn = document.createElement('span');
        btn.className = 'column-toggle';
        btn.textContent = column.title;
        btn.addEventListener('click', () => {
            table.toggleColumn(column.field);
            btn.classList.toggle('hidden');
        });
        container.appendChild(btn);
    }
}

// Resets sorters and header filters
function renderTable(table, columns, data) {
    table.setColumns(columns);
    table.setData(data);
}

// Preserves filters, search, and order
export function refreshTable(table, newData) {
    table.setData(newData);
}

// Full page render (switching views)
let previousView = null;
export async function renderView(viewKey, tableData) {
    const view = VIEWS[viewKey];
    if (!view) return;

    if (previousView === viewKey) return;
    previousView = viewKey;

    renderNavbar(viewKey);
    renderActionButton(view);

    resetFilterState(view.filters);
    renderFilters(view);

    await renderTable(table, view.columns, tableData);

    table.off('rowClick');
    if (view.getRowData) {
        table.on('rowClick', async (e, row) => {
            const id = row.getData().id;
            const rowData = await view.getRowData(id);
            await openModal(viewKey, 'edit', rowData, id);
        });
    }

    enableSearch(document.getElementById('search-input'), table);
    renderColumnToggles(view);

    const usernameEl = document.querySelector('#user-name');
    if (usernameEl) usernameEl.textContent = "PLACEHOLDER USERNAME";
}

// Filter Table Logic
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