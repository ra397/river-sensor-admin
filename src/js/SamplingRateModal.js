import { table } from "./table.js";
import { changeSamplingRates, getObservatoryTableData } from "./api.js";
import { refreshTable } from "./ViewManager.js";

export function openSamplingRateModal() {
    const modal = document.getElementById('sampling-rate-modal');
    const closeBtn = modal.querySelector('.modal-close');
    const submitBtn = modal.querySelector('.submit-btn');
    const confirmSection = modal.querySelector('.modal-confirm');
    const confirmMessage = modal.querySelector('.confirm-message');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const approveBtn = modal.querySelector('.approve-btn');
    const input = modal.querySelector('input[name="sampling_rate"]');
    const modalBody = modal.querySelector('.modal-body');
    const modalActions = modal.querySelector('.modal-actions');

    // Reset state
    input.value = 2;
    confirmSection.classList.add('hidden');
    modalBody.classList.remove('hidden');
    modalActions.classList.remove('hidden');

    modal.classList.add('open');

    const closeModal = () => {
        modal.classList.remove('open');
    };

    const onCloseClick = () => closeModal();
    const onBackdropClick = (e) => {
        if (e.target === modal) closeModal();
    };

    closeBtn.addEventListener('click', onCloseClick);
    modal.addEventListener('click', onBackdropClick);

    submitBtn.addEventListener('click', () => {
        const filteredData = table.getData("active");
        const sensorIds = filteredData
            .map(row => row.sensor)
            .filter(id => id);

        if (sensorIds.length === 0) {
            alert('No sensors in the current filtered view.');
            return;
        }

        confirmMessage.textContent = `Are you sure you want to change the sampling rate of ${sensorIds.length} sensors?`;
        modalBody.classList.add('hidden');
        modalActions.classList.add('hidden');
        confirmSection.classList.remove('hidden');
    });

    cancelBtn.addEventListener('click', () => {
        confirmSection.classList.add('hidden');
        modalBody.classList.remove('hidden');
        modalActions.classList.remove('hidden');
    });

    approveBtn.addEventListener('click', async () => {
        const filteredData = table.getData("active");
        const sensorIds = filteredData
            .map(row => row.sensor)
            .filter(id => id);
        const samplingRate = parseInt(input.value, 10);

        await changeSamplingRates(sensorIds, samplingRate);
        const newData = await getObservatoryTableData();
        refreshTable(table, newData);
        closeModal();
    });
}
