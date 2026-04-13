import {TabulatorFull as Tabulator} from "tabulator-tables";

export const table = new Tabulator("#table", {
    height: '100%',
    layout: "fitColumns",
    pagination: true,
    paginationSize: 50,
    selectable: 1,
});