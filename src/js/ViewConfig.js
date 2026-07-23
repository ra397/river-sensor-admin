import {
    getObservatoryTableData,
    getSensorTableData,
    getTicketTableData,
    getSensorOptions,
    getObservatoryData, getSensorData,
    createNewObservatory, editObservatory, createNewSensor, editSensor, createNewTicket, editTicket, getTicketData,
    getMaintenanceCrew, getUsersTableData, getUserData, updateUserPermissions, createUser, deleteUser
} from "./api.js";
import { datetimeNow, openModal, populateModal } from "./ModalManager.js";
import { showPlotly } from "./plotly.js";
import { openSamplingRateModal } from "./SamplingRateModal.js";
import {confirmDeleteUser} from "./confirm.js";

export const VIEWS = {
    observatories: {
        title: 'Bridges',
        actions: [
            { label: 'Create Bridge', handler: () => populateModal('observatories', 'create'), permission: 'create_bridge' },
            { label: 'Change Sampling Rate', handler: () => openSamplingRateModal(), permission: 'update_sensor' }
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
            status:       { label: 'Status',         type: 'includes',         options: ['Show All', 'active', 'defective', 'suspended', 'retired'] },
            rate:         { label: 'Rate',           type: 'includes',         options: ['Show All', '2', '3', '4', '5'] },
            // firmware:     { label: 'Firmware',       type: 'includes',         options: ['Show All', '0.6', '0.86', '0.88', '0.89', '0.90', '1.00', '1.01', '6.1'] },
            no_pckt_days: { label: 'No Packet Days', type: 'range',            options: ['Show All', '< 7', '7 - 14', '> 14'] },
            voltage:      { label: 'Voltage',        type: 'range',            options: ['Show All', '< 11.76', '11.76 - 12.07', '12.07 - 12.41', '12.41 - 12.64', '> 12.64'] },
            tools:        { label: 'Tools',          type: 'includes',         options: ['Show All', 'Ticket', 'Public Note'] },
        },
        columns: [
            {title: 'id', field: 'id', visible: false},
            {title: "Name", field: "name", width: 160},
            // {title: "NWSLI", field: "nwsli"},
            {title: "Status", field: "status"},
            {title: "Sensor", field: "sensor"},
            {title: "River", field: "river"},
            {title: "Town", field: "town"},
            {title: "Lat/Lng", field: "gps"},
            {title: "Rate", field: "rate", sorter: "number"},
            {title: "Voltage", field: "voltage", sorter: "number"},
            // {title: "Firmware", field: "firmware", sorter: "number"},
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
                    handler: () => openModal('observatories'),
                    permission: 'update_bridge',
                },
                {
                    icon: `<svg class="row-action-btn" width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 5V19C4 19.5523 4.44772 20 5 20H19" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M18 9L13 13.9999L10.5 11.4998L7 14.9998" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>`,
                    handler: () => showPlotly(),
                },
            ]
        }
    },

    // sensors: {
    //     title: 'Sensors',
    //     actions: [
    //         { label: 'Create Sensor', handler: () => populateModal('sensors', 'create'), permission: 'create_sensor' },
    //     ],
    //     filters: {
    //         status:       { label: 'Status',         type: 'includes',         options: ['Show All', 'active', 'maintenance', 'decommissioned'] },
    //         rate:         { label: 'Rate',           type: 'includes',         options: ['Show All', '2', '3', '4', '5'] },
    //         // firmware:     { label: 'Firmware',       type: 'includes',         options: ['Show All', '0.6', '0.86', '0.88', '0.89', '0.90', '1.00', '1.01', '6.1'] },
    //     },
    //     modal: {
    //         create: { title: 'Create Sensor', method: createNewSensor },
    //         edit:   { title: 'Edit Sensor',   method: editSensor },
    //         templateId: 'sensor',
    //         prefill: {
    //             statusOptions: ['', 'active', 'maintenance', 'decommissioned'],
    //             datetimeNow: datetimeNow,
    //         },
    //     },
    //     columns: [
    //         {title: 'id', field: 'id', visible: false},
    //         {title: "Sensor", field: "id", width: 116},
    //         {title: "Status", field: "status"},
    //         {title: "Firmware", field: "firmware"},
    //         {title: "IMEI", field: "imei"},
    //         {title: "Rate", field: "rate"},
    //         {title: "Creation Date", field: "creationDate"},
    //         {title: "Retirement Date", field: "retirementDate"},
    //     ],
    //     getData: getSensorTableData,
    //     getRowData: (id) => getSensorData(id),
    //     rowActions: {
    //         column: 'id',
    //         buttons: [
    //             {
    //                 icon: `<svg class="row-action-btn" width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    //                     <path d="M15.5 5.5L18.5 8.5" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    //                     <path d="M6 16L5 19L8 18L17.5 8.5L15.5 5.5L6 16Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    //                 </svg>`,
    //                 handler: () => openModal('sensors'),
    //                 permission: 'update_sensor',
    //             }
    //         ]
    //     }
    // },

    tickets: {
        title: 'Tickets',
        actions: [{ label: 'Create Ticket', handler: () => populateModal('tickets', 'create'), }],
        filters: {
            status:       { label: 'Status',         type: 'includes',         options: ['Show All', 'assigned', 'suspended', 'done'] },
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
                    handler: () => openModal('tickets'),
                }
            ]
        }
    },

    users: {
        title: 'Users',
        actions: [{ label: 'Add User', handler: () => populateModal('users', 'create'), permission: 'manage_permissions' }],
        filters: {},
        modal: {
            create: { title: 'Add User', method: createUser },
            edit: { title: 'Edit Permissions', method: updateUserPermissions },
            templateId: 'user',
            prefill: {},
        },
        columns: [
            { title: '#', field: 'id', width: 80 },
            { title: 'Email', field: 'email' },
            { title: 'Name', field: 'name' },
        ],
        getData: getUsersTableData,
        getRowData: (id) => getUserData(id),
        rowActions: {
            column: 'id',
            buttons: [
                {
                    icon: `<svg class="row-action-btn" width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M15.5 5.5L18.5 8.5" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                              <path d="M6 16L5 19L8 18L17.5 8.5L15.5 5.5L6 16Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>`,
                    handler: () => openModal('users'),
                    permission: 'manage_permissions',
                },
                {
                    icon: `<svg class='row-action-btn' fill="#000" width="1em" height="1em" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                                <path class="clr-i-outline clr-i-outline-path-1" d="M27.14,34H8.86A2.93,2.93,0,0,1,6,31V11.23H8V31a.93.93,0,0,0,.86,1H27.14A.93.93,0,0,0,28,31V11.23h2V31A2.93,2.93,0,0,1,27.14,34Z"></path><path class="clr-i-outline clr-i-outline-path-2" d="M30.78,9H5A1,1,0,0,1,5,7H30.78a1,1,0,0,1,0,2Z"></path><rect class="clr-i-outline clr-i-outline-path-3" x="21" y="13" width="2" height="15"></rect><rect class="clr-i-outline clr-i-outline-path-4" x="13" y="13" width="2" height="15"></rect><path class="clr-i-outline clr-i-outline-path-5" d="M23,5.86H21.1V4H14.9V5.86H13V4a2,2,0,0,1,1.9-2h6.2A2,2,0,0,1,23,4Z"></path>
                                <rect x="0" y="0" width="1em" height="1em" fill-opacity="0"/>
                            </svg>`,
                    handler: async (rowData, ctx) => await confirmDeleteUser(rowData.id, ctx),
                    permission: 'manage_permissions',
                    hidden: (row, currentUserEmail) => row?.email === currentUserEmail,
                }
            ]
        }
    }
};