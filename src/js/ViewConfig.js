import {
    getObservatoryTableData,
    getSensorTableData,
    getTicketTableData,
    getSensorOptions,
    getObservatoryData, getSensorData,
    createNewObservatory, editObservatory, createNewSensor, editSensor, createNewTicket, editTicket, getTicketData,
    getMaintenanceCrew
} from "./api.js";
import {datetimeNow, openModal} from "./ModalManager.js";
import {showReports} from "./plotly.js";
import {openSamplingRateModal} from "./SamplingRateModal.js";

export const VIEWS = {
    observatories: {
        title: 'Bridges',
        actions: [
            { label: 'Create Bridge', handler: () => openModal('observatories', 'create') },
            { label: 'Change Sampling Rate', handler: () => openSamplingRateModal() }
        ],
        modal: {
            create: { title: 'Create Bridge', method: createNewObservatory },
            edit:   { title: 'Edit Bridge',   method: editObservatory },
            templateId: 'observatory',
            prefill: {
                stateOptions: ['', "IA", "IL", "WA", "CO"],
                statusOptions: ['', 'active', 'defective', 'suspended', 'retired'],
                sensorOptions: getSensorOptions,
                upDownOptions: ['', 'U', 'D'],
            },
        },
        filters: {
            status:       { label: 'Status',         type: 'includes',         options: ['active', 'defective', 'suspended', 'retired'] },
            rate:         { label: 'Rate',           type: 'includes',         options: ['2', '3', '4', '5'] },
            firmware:     { label: 'Firmware',       type: 'includes',         options: ['0.6', '0.86', '0.88', '0.89', '0.90', '1.00', '1.01', '6.1'] },
            no_pckt_days: { label: 'No Packet Days', type: 'range',            options: ['< 7', '7 - 14', '> 14'] },
            voltage:      { label: 'Voltage',        type: 'range',            options: ['< 10', '10 - 11', '11 - 12', '12 - 13', '> 13'] },
            tools:        { label: 'Tools',          type: 'includes',         options: ['Ticket', 'Public Note', 'Syncable'] },
        },
        columns: [
            {title: 'id', field: 'id', visible: false},
            {title: "Name", field: "name", width: 160},
            {title: "NWSLI", field: "nwsli"},
            {title: "Status", field: "status"},
            {title: "Sensor", field: "sensor"},
            {title: "River", field: "river"},
            {title: "Town", field: "town"},
            {title: "Lat/Lng", field: "gps"},
            {title: "Rate", field: "rate", sorter: "number"},
            {title: "Voltage", field: "voltage", sorter: "number"},
            {title: "Firmware", field: "firmware", sorter: "number"},
            {title: "Date", field: "date",
                sorter: function(a, b) {
                    return new Date(a).getTime() - new Date(b).getTime();
                }
            },
            {title: "No Packet Days", field: "no_pckt_days", sorter: "number"},
            {title: "Wet", field: "wet"},
            {title: "Miss", field: "misread"},
        ],
        getData: getObservatoryTableData,
        getRowData: (id) => getObservatoryData(id),
        rowActions: {
            column: 'name',
            buttons: [
                {
                    icon: `<svg class="row-action-btn" width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15.5 5.5L18.5 8.5" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M6 16L5 19L8 18L17.5 8.5L15.5 5.5L6 16Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>`,
                    handler: (rowData) => openModal('observatories', 'edit', rowData, rowData.id),
                },
                {
                    icon: `<svg class="row-action-btn" width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 5V19C4 19.5523 4.44772 20 5 20H19" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M18 9L13 13.9999L10.5 11.4998L7 14.9998" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>`,
                    handler: (rowData) => showReports(rowData.oid),
                },
            ]
        }
    },

    sensors: {
        title: 'Sensors',
        actions: [
            { label: 'Create Sensor', handler: () => openModal('sensors', 'create'), }
        ],
        filters: {
            status:       { label: 'Status',         type: 'includes',         options: ['active', 'maintenance', 'decommissioned'] },
            rate:         { label: 'Rate',           type: 'includes',         options: ['2', '3', '4', '5'] },
            firmware:     { label: 'Firmware',       type: 'includes',         options: ['0.6', '0.86', '0.88', '0.89', '0.90', '1.00', '1.01', '6.1'] },
        },
        modal: {
            create: { title: 'Create Sensor', method: createNewSensor },
            edit:   { title: 'Edit Sensor',   method: editSensor },
            templateId: 'sensor',
            prefill: {
                statusOptions: ['', 'active', 'maintenance', 'decommissioned'],
                datetimeNow: datetimeNow,
            },
        },
        columns: [
            {title: 'id', field: 'id', visible: false},
            {title: "Sensor", field: "id", width: 116},
            {title: "Status", field: "status"},
            {title: "Firmware", field: "firmware"},
            {title: "IMEI", field: "imei"},
            {title: "Rate", field: "rate"},
            {title: "Creation Date", field: "creationDate"},
            {title: "Retirement Date", field: "retirementDate"},
        ],
        getData: getSensorTableData,
        getRowData: (id) => getSensorData(id),
        rowActions: {
            column: 'id',
            buttons: [
                {
                    icon: `<svg class="row-action-btn" width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15.5 5.5L18.5 8.5" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M6 16L5 19L8 18L17.5 8.5L15.5 5.5L6 16Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>`,
                    handler: (rowData) => openModal('sensors', 'edit', rowData, rowData.id),
                }
            ]
        }
    },

    tickets: {
        title: 'Tickets',
        actions: [{ label: 'Create Ticket', handler: () => openModal('tickets', 'create'), }],
        filters: {
            status:       { label: 'Status',         type: 'includes',         options: ['assigned', 'suspended', 'done'] },
        },
        modal: {
            create: { title: 'Create Ticket', method: createNewTicket },
            edit:   { title: 'Edit Ticket', method: editTicket },
            templateId: 'ticket',
            prefill: {
                maintenanceCrew: getMaintenanceCrew,
                ticketStatus: ['assigned', 'suspended', 'done'],
            }
        },
        columns: [
            {title: "#", field: "id", width: 80},
            {title: "Bridge", field: "bridge"},
            {title: "Sensor", field: "sensor"},
            {title: "Status", field: "status"},
            {title: "Created at", field: "createdAt"},
            {title: "Created by", field: "createdBy"},
            {title: "Assigned to", field: "assignedTo"},
            {title: "Problem", field: "problem"},
        ],
        getData: getTicketTableData,
        getRowData: (id) => getTicketData(id),
        rowActions: {
            column: 'id',
            buttons: [
                {
                    icon: `<svg class="row-action-btn" width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15.5 5.5L18.5 8.5" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M6 16L5 19L8 18L17.5 8.5L15.5 5.5L6 16Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>`,
                    handler: (rowData) => openModal('tickets', 'edit', rowData, rowData.id),
                }
            ]
        }
    },
};