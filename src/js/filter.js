
import { table } from "../main.js";

let filterState = {};
let filterCounts = {};
let searchTerm = '';
let currentFilters = {};

export function resetFilterState(filters) {
    for (const key of Object.keys(filterState)) delete filterState[key];
    for (const key of Object.keys(filterCounts)) delete filterCounts[key];

    for (const [key, filter] of Object.entries(filters)) {
        filterState[key] = [...filter.options];
        filterCounts[key] = filter.options.length;
    }

    currentFilters = filters;
    searchTerm = '';
}

export function toggleFilterOption(category, value, checked) {
    if (checked) {
        filterState[category].push(value);
    } else {
        filterState[category] = filterState[category].filter(v => v !== value);
    }
}

export function enableSearch(oldSearchInputEl) {
    let debounceTimer;
    const searchInputEl = oldSearchInputEl.cloneNode(true);
    oldSearchInputEl.replaceWith(searchInputEl);
    searchInputEl.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            searchTerm = e.target.value;
            applyFilters();
        }, 300);
    });
}

export function applyFilters() {
    table.setFilter(buildFilterFunc());
}

function buildFilterFunc() {
    return function (data) {
        // Checkbox filters
        for (const [key, filter] of Object.entries(currentFilters)) {
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

        // Search filter
        if (searchTerm) {
            const matches = Object.values(data).some(value =>
                String(value).toLowerCase().includes(searchTerm.toLowerCase())
            );
            if (!matches) return false;
        }

        return true;
    };
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
