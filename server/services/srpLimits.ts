import fs from "fs";
import path from "path";

interface SrpTier {
  name: string;
  maxPayout: number;
  classes: string[];
}

interface SrpLimitsData {
  version: string;
  description: string;
  tiers: SrpTier[];
}

interface SrpSpecialClassData {
  version: string;
  description: string;
  specialClasses: string[];
}

class SrpLimitsService {
  private limitsData: SrpLimitsData | null = null;
  private specialClassData: SrpSpecialClassData | null = null;
  private classToMaxPayout: Map<string, number> = new Map();
  private classToTier: Map<string, string> = new Map();
  private specialClasses: Set<string> = new Set();

  async initialize(): Promise<void> {
    const limitsPath = path.join(process.cwd(), "server/staticData/srpLimits.json");
    const specialClassPath = path.join(process.cwd(), "server/staticData/srpSpecialClass.json");

    if (!fs.existsSync(limitsPath)) {
      console.warn("SRP limits file not found at:", limitsPath);
      return;
    }

    const data = fs.readFileSync(limitsPath, "utf-8");
    this.limitsData = JSON.parse(data) as SrpLimitsData;

    this.classToMaxPayout.clear();
    this.classToTier.clear();

    for (const tier of this.limitsData.tiers) {
      for (const className of tier.classes) {
        this.classToMaxPayout.set(className, tier.maxPayout);
        this.classToTier.set(className, tier.name);
      }
    }

    // Load special classes
    if (fs.existsSync(specialClassPath)) {
      const specialData = fs.readFileSync(specialClassPath, "utf-8");
      this.specialClassData = JSON.parse(specialData) as SrpSpecialClassData;
      this.specialClasses = new Set(this.specialClassData.specialClasses);
      console.log(`SRP special classes loaded: ${this.specialClasses.size} classes`);
    }

    console.log(`SRP limits loaded: ${this.classToMaxPayout.size} ship classes, version ${this.limitsData.version}`);
  }

  getSoloMaxPayout(groupName: string): number | null {
    return this.classToMaxPayout.get(groupName) ?? null;
  }

  getTierName(groupName: string): string | null {
    return this.classToTier.get(groupName) ?? null;
  }

  isSpecialClass(groupName: string): boolean {
    return this.specialClasses.has(groupName);
  }

  getSpecialClasses(): string[] {
    return Array.from(this.specialClasses);
  }

  getAllTiers(): SrpTier[] {
    return this.limitsData?.tiers || [];
  }

  isLoaded(): boolean {
    return this.limitsData !== null;
  }

  getVersion(): string | null {
    return this.limitsData?.version || null;
  }
}

export const srpLimitsService = new SrpLimitsService();
