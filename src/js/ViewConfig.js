import {
    getObservatoryTableData,
    getSensorTableData,
    getTicketTableData,
    getSensorOptions,
    getObservatoryData, getSensorData,
    createNewObservatory, editObservatory, createNewSensor, editSensor, createNewTicket, editTicket
} from "./api.js";
import {datetimeNow, openModal} from "./ModalManager.js";

export const VIEWS = {
    observatories: {
        title: 'Bridges',
        action: { label: 'Create Bridge', handler: () => openModal('observatories', 'create') },
        modal: {
            create: { title: 'Create Bridge', method: createNewObservatory },
            edit:   { title: 'Edit Bridge',   method: editObservatory },
            templateId: 'observatory',
            prefill: {
                stateOptions: ['', "IA", "IL", "WA", "CO"],
                statusOptions: ['', 'active', 'maintenance', 'decommissioned'],
                sensorOptions: getSensorOptions,
                upDownOptions: ['', 'U', 'D'],
            },
        },
        filters: {
            status:       { label: 'Status',         type: 'includes',         options: ['active', 'maintenance', 'decommissioned'] },
            rate:         { label: 'Rate',           type: 'includes',         options: ['2', '3', '4', '5'] },
            firmware:     { label: 'Firmware',       type: 'includes',         options: ['0.6', '0.86', '0.88', '0.89', '0.90', '1.00', '1.01', '6.1'] },
            no_pckt_days: { label: 'No Packet Days', type: 'range',            options: ['< 7', '7 - 14', '> 14'] },
            voltage:      { label: 'Voltage',        type: 'range',            options: ['< 10', '10 - 11', '11 - 12', '12 - 13', '> 13'] },
            tools:        { label: 'Tools',          type: 'includes',         options: ['Ticket', 'Public Note', 'Syncable'] },
        },
        columns: [
            {title: 'id', field: 'id', visible: false},
            {title: "Name", field: "name"},
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
    },

    sensors: {
        title: 'Sensors',
        action: { label: 'Create Sensor', handler: () => openModal('sensors', 'create'), },
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
            {title: "Sensor", field: "id"},
            {title: "Status", field: "status"},
            {title: "Firmware", field: "firmware"},
            {title: "IMEI", field: "imei"},
            {title: "Rate", field: "rate"},
            {title: "Creation Date", field: "creationDate"},
            {title: "Retirement Date", field: "retirementDate"},
        ],
        getData: getSensorTableData,
        getRowData: (id) => getSensorData(id),
    },

    tickets: {
        title: 'Tickets',
        action: { label: 'Create Ticket', handler: () => openModal('tickets', 'create'), },
        filters: {
            status:       { label: 'Status',         type: 'includes',         options: ['assigned', 'suspended', 'done'] },
        },
        modal: {
            create: { title: 'Create Ticket', method: createNewTicket },
            edit:   { title: 'Edit Ticket', method: editTicket },
            templateId: 'tickets',
            prefill: {

            }
        },
        columns: [
            {title: "#", field: "tid"},
            {title: "Bridge", field: "bridge"},
            {title: "Sensor", field: "sensor"},
            {title: "Status", field: "status"},
            {title: "Created at", field: "createdAt"},
            {title: "Created by", field: "createdBy"},
            {title: "Assigned to", field: "assignedTo"},
            {title: "Problem", field: "problem"},
        ],
        getData: getTicketTableData,
    },
};