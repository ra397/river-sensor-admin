import { getObservatoryTableData, getSensorTableData, getTicketTableData, getSensorOptions } from "./getData.js";
import { openModal } from "./ModalManager.js";

export const VIEWS = {
    observatories: {
        title: 'Bridges',
        action: { label: 'Create Bridge', handler: () => openModal('observatories', 'create') },
        modal: {
            create: { title: 'Create Bridge', method: 'POST' },
            edit:   { title: 'Edit Bridge',   method: 'PATCH' },
            fields: [
                [{ label: 'Name', name: 'name' }],
                [{ label: 'Sensor', name: 'sensor', type: 'select', optionsFrom: getSensorOptions }],
                [{ label: 'Status', name: 'status', type: 'select', options: ['new', 'active', 'defective', 'suspended', 'retired'], mode: 'edit' }],
                [
                    { label: 'State', name: 'state', type: 'select', options: ['IA', 'IL', 'MO'] },
                    { label: 'County', name: 'county' },
                    { label: 'Town', name: 'town' },
                ],
                [{ label: 'River', name: 'river' }],
                [
                    { label: 'Latitude', name: 'lat' },
                    { label: 'Longitude', name: 'lng' },
                ],
                [{ label: 'Road', name: 'road' }],
                [{ label: 'Intersection', name: 'intersection' }],
                [
                    { label: 'Distance', name: 'distance' },
                    { label: 'Elevation', name: 'elevation' },
                ],
                [
                    { label: 'Orientation', name: 'orientation' },
                    { label: 'Up/Down', name: 'updown', type: 'select', options: ['', 'Up', 'Down'] },
                ],
                [{ label: 'Cooperator', name: 'cooperator' }],
                [{ label: 'Public Note', name: 'publicNote', type: 'textarea', mode: 'edit' }],
            ],
        },
        filters: {
            status:       { label: 'Status',         type: 'includes',         options: ['active', 'defective', 'retired', 'suspended'] },
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
            {title: "Date", field: "date"},
            {title: "No Packet Days", field: "no_pckt_days", sorter: "number"},
            {title: "Wet", field: "wet"},
            {title: "Miss", field: "misreads"},
        ],
        getData: getObservatoryTableData,
    },

    sensors: {
        title: 'Sensors',
        action: { label: 'Create Sensor', handler: () => console.log("Create Sensor"), },
        filters: {
            status:       { label: 'Status',         type: 'includes',         options: ['active', 'defective', 'retired', 'suspended'] },
            rate:         { label: 'Rate',           type: 'includes',         options: ['2', '3', '4', '5'] },
            firmware:     { label: 'Firmware',       type: 'includes',         options: ['0.6', '0.86', '0.88', '0.89', '0.90', '1.00', '1.01', '6.1'] },
        },
        columns: [
            {title: "Sensor", field: "sid"},
            {title: "Status", field: "status"},
            {title: "Firmware", field: "firmware"},
            {title: "IMEI", field: "imei"},
            {title: "Rate", field: "rate"},
            {title: "Creation Date", field: "creationDate"},
            {title: "Retirement Date", field: "retirementDate"},
        ],
        getData: getSensorTableData,
    },

    tickets: {
        title: 'Tickets',
        action: { label: 'Create Ticket', handler: () => console.log('Create Ticket') },
        filters: {},
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

    users: {
        title: 'Users',
        action: null,
        filters: {},
    },
};