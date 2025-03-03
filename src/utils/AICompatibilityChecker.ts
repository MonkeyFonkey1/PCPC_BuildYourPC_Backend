import { IComponent } from '../models/component';

export class AICompatibilityChecker {
    private components: IComponent[];

    constructor(components: IComponent[]) {
        this.components = components;
    }

    validate(): string[] {
        const issues: string[] = [];

        const cpu = this.components.find(c => c.type === 'CPU');
        const gpu = this.components.find(c => c.type === 'GPU');
        const psu = this.components.find(c => c.type === 'PSU');
        const storage = this.components.filter(c => c.type === 'Storage');
        const motherboard = this.components.find(c => c.type === 'Motherboard');

        console.log("🔍 Running AI Build Compatibility Check...");

        if (psu) {
            console.log("Checking PSU wattage...");
            const cpuPower = parseInt(cpu?.specs.powerDraw || '0');
            const gpuPower = parseInt(gpu?.specs.powerDraw || '0');
            const totalPowerNeeded = cpuPower + gpuPower;

            if (psu.specs.wattage < totalPowerNeeded) {
                issues.push(`❌ PSU (${psu.modelName}) wattage (${psu.specs.wattage}W) is insufficient. Required: ${totalPowerNeeded}W.`);
            }
        }

        if (motherboard && storage.length) {
            console.log("Checking Storage compatibility with Motherboard...");
            const availableSataPorts = motherboard.specs.sataPorts || 0;
            const availableNvmeSlots = motherboard.specs.nvmeSlots || 0;

            const sataDrives = storage.filter(s => s.specs.connectionType === 'SATA').length;
            const nvmeDrives = storage.filter(s => s.specs.connectionType === 'NVMe').length;

            if (sataDrives > availableSataPorts) {
                issues.push(`❌ Not enough SATA ports on Motherboard (${motherboard.modelName}). Available: ${availableSataPorts}, Required: ${sataDrives}.`);
            }

            if (nvmeDrives > availableNvmeSlots) {
                issues.push(`❌ Not enough NVMe slots on Motherboard (${motherboard.modelName}). Available: ${availableNvmeSlots}, Required: ${nvmeDrives}.`);
            }
        }

        console.log("🔍 AI Build Compatibility Check Complete.");
        return issues;
    }
}
