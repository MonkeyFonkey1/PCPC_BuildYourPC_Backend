import Component, { IComponent } from '../models/component';

export class CompatibilityChecker {
    private components: IComponent[];

    constructor(components: IComponent[]) {
        this.components = components;
    }

    validate(): string[] {
        const issues: string[] = [];

        const cpu = this.components.find(c => c.type === 'CPU');
        const motherboard = this.components.find(c => c.type === 'Motherboard');
        const ram = this.components.find(c => c.type === 'RAM');
        const gpu = this.components.find(c => c.type === 'GPU');
        const psu = this.components.find(c => c.type === 'PSU');
        const pcCase = this.components.find(c => c.type === 'PC Case' || c.type === 'Case');
        const storage = this.components.filter(c => c.type === 'Storage');

        console.log("🔍 Starting Compatibility Checks...");

        // ✅ CPU & Motherboard Socket Compatibility
        if (cpu && motherboard) {
            const cpuSocket = cpu.socket?.trim().toLowerCase() || cpu.specs.socket?.trim().toLowerCase();
            const motherboardSocket = motherboard.socket?.trim().toLowerCase() || motherboard.specs.socket?.trim().toLowerCase();

            console.log(`CPU Socket: "${cpuSocket}", Motherboard Socket: "${motherboardSocket}"`);

            if (cpuSocket && motherboardSocket && cpuSocket !== motherboardSocket) {
                issues.push(`❌ CPU (${cpu.modelName}) socket (${cpuSocket}) is incompatible with Motherboard (${motherboard.modelName}) socket (${motherboardSocket}).`);
            }
        } else {
            console.log("⚠️ CPU or Motherboard not found.");
        }

        // ✅ RAM & Motherboard Memory Type
        if (ram && motherboard) {
            console.log(`Checking RAM (${ram.modelName}) and Motherboard (${motherboard.modelName}) memory type compatibility...`);
            if (ram.specs.memoryType !== motherboard.specs.memoryType) {
                issues.push(`❌ RAM (${ram.modelName}) type (${ram.specs.memoryType}) is not supported by Motherboard (${motherboard.modelName}) which supports ${motherboard.specs.memoryType}.`);
            }
        }

        // ✅ PSU Wattage Check (CPU + GPU Power Draw)
        if (psu) {
            console.log("Checking PSU wattage...");
            const cpuPower = parseInt(cpu?.specs.tdp || '0');
            const gpuPower = parseInt(gpu?.specs.tdp || '0');
            const totalPowerNeeded = cpuPower + gpuPower;

            if (psu.specs.wattage < totalPowerNeeded) {
                issues.push(`❌ PSU (${psu.modelName}) wattage (${psu.specs.wattage}W) is insufficient. Required: ${totalPowerNeeded}W.`);
            }
        }

        // ✅ GPU Size & PC Case Size
        if (gpu && pcCase) {
            console.log("Checking GPU size and PC case compatibility...");
            const gpuLength = parseInt(gpu.specs.length || '0');
            const caseGpuMaxLength = parseInt(pcCase.specs.gpuMaxLength || '0');

            if (gpuLength > caseGpuMaxLength) {
                issues.push(`❌ GPU (${gpu.modelName}) length (${gpuLength}mm) exceeds PC Case (${pcCase.modelName}) limit (${caseGpuMaxLength}mm).`);
            }
        }

        // ✅ Storage Compatibility (SATA/NVMe)
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

        console.log("🔍 Compatibility Check Complete.");
        return issues;
    }

    // New Methods (For Real-Time Filtering)
    getCompatibleCPUs(motherboard: IComponent, allCPUs: IComponent[]): IComponent[] {
        return allCPUs.filter(cpu => cpu.socket === motherboard.socket || cpu.specs.socket === motherboard.specs.socket);
    }

    getCompatibleRAM(motherboard: IComponent, allRAMs: IComponent[]): IComponent[] {
        return allRAMs.filter(ram => ram.specs.memoryType === motherboard.specs.memoryType);
    }

    getCompatiblePSUs(cpu: IComponent, gpu: IComponent, allPSUs: IComponent[]): IComponent[] {
        const requiredWattage = (cpu?.specs.powerDraw || 0) + (gpu?.specs.powerDraw || 0);
        return allPSUs.filter(psu => psu.specs.wattage >= requiredWattage);
    }

    getCompatibleCases(motherboard: IComponent, allCases: IComponent[]): IComponent[] {
        return allCases.filter(pcCase => pcCase.specs.formFactor === motherboard.specs.formFactor);
    }

    getCompatibleStorage(motherboard: IComponent, allStorage: IComponent[]): IComponent[] {
        const availableSataPorts = motherboard.specs.sataPorts || 0;
        const availableNvmeSlots = motherboard.specs.nvmeSlots || 0;

        return allStorage.filter(storage => {
            if (storage.specs.connectionType === 'SATA') {
                return availableSataPorts > 0;
            } else if (storage.specs.connectionType === 'NVMe') {
                return availableNvmeSlots > 0;
            }
            return false;
        });
    }
}
