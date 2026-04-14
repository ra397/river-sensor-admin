import {TabulatorFull as Tabulator} from "tabulator-tables";

export const table = new Tabulator("#table", {
    height: '100%',
    layout: "fitDataStretch",
    pagination: true,
    paginationSize: 50,
    selectable: true,
});