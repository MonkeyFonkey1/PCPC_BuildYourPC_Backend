import Component, { IComponent } from '../models/component';

export class CompatibilityChecker {
    private components: IComponent[];

    constructor(components: IComponent[]) {
        this.components = components;
    }
    checkCPUandMotherboard(): string | null {
        const cpu = this.components.find((c) => c.type === 'CPU');
        const motherboard = this.components.find(
            (c) => c.type === 'Motherboard'
        );

        if (
            cpu &&
            motherboard &&
            cpu.specs.socket !== motherboard.specs.socket
        ) {
            return 'CPU and Motherboard sockets do not match.';
        }
        return null;
    }

    checkRAMandMotherboard(): string | null {
        const ram = this.components.find((c) => c.type === 'RAM');
        const motherboard = this.components.find(
            (c) => c.type === 'Motherboard'
        );

        if (
            ram &&
            motherboard &&
            ram.specs.memoryType !== motherboard.specs.memoryType
        ) {
            return 'RAM type is not supported by the Motherboard.';
        }
        return null;
    }

    checkPSUandPower(): string | null {
        const psu = this.components.find((c) => c.type === 'PSU');
        const cpu = this.components.find((c) => c.type === 'CPU');
        const gpu = this.components.find((c) => c.type === 'GPU');

        if (psu) {
            const requiredWattage =
                (gpu?.specs.powerDraw || 0) + (cpu?.specs.powerDraw || 0);
            if (psu.specs.wattage < requiredWattage) {
                return 'PSU wattage is insufficient for the selected GPU and CPU.';
            }
        }
        return null;
    }

    checkCaseAndMotherboard(): string | null {
        const caseComponent = this.components.find((c) => c.type === 'Case');
        const motherboard = this.components.find(
            (c) => c.type === 'Motherboard'
        );

        if (
            caseComponent &&
            motherboard &&
            caseComponent.specs.formFactor !== motherboard.specs.formFactor
        ) {
            return 'Motherboard form factor does not fit in the selected case.';
        }
        return null;
    }

    checkStorageAndMotherboard(): string | null {
        const motherboard = this.components.find(
            (c) => c.type === 'Motherboard'
        );
        const storage = this.components.filter((c) => c.type === 'Storage');

        if (storage.length > 0 && motherboard) {
            const availableSataPorts = motherboard.specs.sataPorts || 0;
            const availableNvmeSlots = motherboard.specs.nvmeSlots || 0;
            const sataDevices = storage.filter(
                (s) => s.specs.connectionType === 'SATA'
            ).length;
            const nvmeDevices = storage.filter(
                (s) => s.specs.connectionType === 'NVMe'
            ).length;

            if (sataDevices > availableSataPorts) {
                return 'Not enough SATA ports on the Motherboard for the selected storage devices.';
            }

            if (nvmeDevices > availableNvmeSlots) {
                return 'Not enough NVMe slots on the Motherboard for the selected storage devices.';
            }
        }
        return null;
    }

    validate(): string[] {
        const issues: string[] = [];

        const checks = [
            this.checkCPUandMotherboard(),
            this.checkRAMandMotherboard(),
            this.checkPSUandPower(),
            this.checkCaseAndMotherboard(),
            this.checkStorageAndMotherboard(),
        ];

        for (const check of checks) {
            if (check) {
                issues.push(check);
            }
        }

        return issues;
    }
}
