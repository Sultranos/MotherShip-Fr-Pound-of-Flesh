/**
 * Template injection manager - Injecte les sections cyber dans les templates existants
 */

export class TemplateInjectionManager {
  
  static async initialize() {
    console.log("🔧 Initializing template injection manager...");
    
    // Load our custom templates
    await this.loadCustomTemplates();
    
    // Hook into template rendering
    this.setupTemplateHooks();
    
    console.log("✅ Template injection manager initialized");
  }

  static async loadCustomTemplates() {
    const templatePaths = [
      "modules/pound-of-flesh/templates/cyber-weapon-section.hbs",
      "modules/pound-of-flesh/templates/cyber-armor-section.hbs"
    ];

    return foundry.applications.handlebars.loadTemplates(templatePaths);
  }

  static setupTemplateHooks() {
    // Hook for weapon sheet rendering - seulement pour des weapons sans system.cyber
    Hooks.on('renderItemSheet', async (sheet, html, data) => {
      // Ne traiter que les objets de base (sans cybermod) - validation sécurisée
      const system = sheet.item.system || {};
      const hasCyberProperties = Boolean(system.cyber) || Boolean(system.cyberType);
      
      // Vérifier qu'il n'y a pas déjà un onglet cyber
      const existingCyberTab = html.find('a[data-tab="cyber"]');
      if (existingCyberTab.length > 0) {
        console.log("🚫 Onglet cyber déjà présent, injection template annulée");
        return;
      }

      if (sheet.item.type === 'weapon' && !hasCyberProperties) {
        await this.injectCyberSectionToWeapon(sheet, html, data);
      } else if (sheet.item.type === 'armor' && !hasCyberProperties) {
        await this.injectCyberSectionToArmor(sheet, html, data);
      }
    });
  }

  static async injectCyberSectionToWeapon(sheet, html, data) {
    try {
      // Ensure cyber properties exist
      if (!data.system.cyber) {
        data.system.cyber = {
          isCyber: false,
          installed: false,
          cyberRequirements: "",
          overclock: {
            level: 0,
            maxLevel: 3,
            stressCost: 1,
            effects: []
          },
          installation: {
            stress: 1,
            bodyCheck: false,
            medicalCheck: false,
            surgicalProcedure: false
          }
        };
      }

      // Double vérification pour éviter les doublons
      const existingCyberTab = html.find('a[data-tab="cyber"]');
      if (existingCyberTab.length > 0) {
        console.log("🚫 Onglet cyber déjà présent, injection annulée");
        return;
      }

      // Add Cyber tab to navigation seulement si aucun n'existe
      const tabsNav = html.find('nav.sheet-tabs');
      if (tabsNav.length) {
        const cyberTab = $('<a class="tab-select" data-tab="cyber"><i class="fas fa-microchip"></i> Cyber</a>');
        tabsNav.append(cyberTab);
      }

      // Render the cyber section template
      const cyberSectionHtml = await foundry.applications.handlebars.renderTemplate(
        "modules/pound-of-flesh/templates/cyber-weapon-section.hbs",
        data
      );

      // Add cyber tab content to sheet body
      const sheetBody = html.find('section.sheet-body');
      if (sheetBody.length) {
        const cyberTabContent = `<div class="tab" data-group="primary" data-tab="cyber">${cyberSectionHtml}</div>`;
        sheetBody.append(cyberTabContent);
      }

      console.log("✅ Cyber tab added to weapon sheet");
    } catch (error) {
      console.error("❌ Error injecting cyber section into weapon sheet:", error);
    }
  }

  static async injectCyberSectionToArmor(sheet, html, data) {
    try {
      // Ensure cyber properties exist
      if (!data.system.cyber) {
        data.system.cyber = {
          isCyber: false,
          installed: false,
          cyberRequirements: "",
          overclock: {
            level: 0,
            maxLevel: 3,
            stressCost: 1,
            effects: []
          },
          installation: {
            stress: 1,
            bodyCheck: false,
            medicalCheck: false,
            surgicalProcedure: false
          }
        };
      }

      // Double vérification pour éviter les doublons
      const existingCyberTab = html.find('a[data-tab="cyber"]');
      if (existingCyberTab.length > 0) {
        console.log("🚫 Onglet cyber déjà présent, injection annulée");
        return;
      }

      // Add Cyber tab to navigation seulement si aucun n'existe
      const tabsNav = html.find('nav.sheet-tabs');
      if (tabsNav.length) {
        const cyberTab = $('<a class="tab-select" data-tab="cyber"><i class="fas fa-shield-alt"></i> Cyber</a>');
        tabsNav.append(cyberTab);
      }

      // Render the cyber section template
      const cyberSectionHtml = await foundry.applications.handlebars.renderTemplate(
        "modules/pound-of-flesh/templates/cyber-armor-section.hbs",
        data
      );

      // Add cyber tab content to sheet body
      const sheetBody = html.find('section.sheet-body');
      if (sheetBody.length) {
        const cyberTabContent = `<div class="tab" data-group="primary" data-tab="cyber">${cyberSectionHtml}</div>`;
        sheetBody.append(cyberTabContent);
      }

      console.log("✅ Cyber tab added to armor sheet");
    } catch (error) {
      console.error("❌ Error injecting cyber section into armor sheet:", error);
    }
  }
}