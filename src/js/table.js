import {TabulatorFull as Tabulator} from "tabulator-tables";

export const table = new Tabulator("#table", {
    height: '100%',
    layout: "fitDataStretch",
    pagination: true,
    paginationSize: 50,
    selectable: 1,
});

const tableEl = document.getElementById("table");
document.addEventListener("click", (e) => {
    if (!tableEl.contains(e.target) && !e.target.closest('.modal')) {
        table.deselectRow();
        const existing = document.querySelector('.action-btn-wrapper');
        if (existing) existing.remove();
    }
});