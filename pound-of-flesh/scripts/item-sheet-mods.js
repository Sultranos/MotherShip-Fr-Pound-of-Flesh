/**
 * Item Sheet Modifications for Cybermods
 */
export class ItemSheetModifications {
  constructor() {
    this.debug = false;
  }

  initialize() {
    this.debug = game.settings.get('pound-of-flesh', 'debugMode');
    this.log('ItemSheetModifications initialized');
    
    // Hook into item sheet rendering
    Hooks.on('renderItemSheet', this.onRenderItemSheet.bind(this));
  }

  log(message) {
    if (this.debug) {
      console.log(`Pound of Flesh | ItemSheetMods | ${message}`);
    }
  }

  /**
   * Modify item sheet when rendered
   */
  async onRenderItemSheet(sheet, html, data) {
    // Only modify items for Mothership-Fr system
    if (game.system.id !== 'mothership-fr') {
      return;
    }

    // Add cyber checkbox to weapons and items
    if (sheet.item.type === 'weapon' || sheet.item.type === 'item') {
      await this._addCyberCheckbox(sheet, html, data);
    }

    // Add cybermod specific fields for items marked as cyber
    if (sheet.item.system.cyber || sheet.item.system.cyberType) {
      await this._addCybermodsFields(sheet, html, data);
    }

    this.log(`Processed item sheet for ${sheet.item.name}`);
  }

  /**
   * Add cyber checkbox to weapon and item sheets
   */
  async _addCyberCheckbox(sheet, html, data) {
    // MODIFICATION: Ne plus ajouter dans la description, utiliser l'onglet cyber
    // Vérifier si l'onglet cyber existe
    const cyberTab = html.find('a[data-tab="cyber"]');
    const cyberTabContent = html.find('.tab[data-tab="cyber"]');
    
    if (cyberTab.length > 0 && cyberTabContent.length > 0) {
      // Si l'onglet cyber existe, ne pas ajouter de checkbox séparé
      // Le template cyber gère déjà la checkbox isCyber
      this.log(`Using existing cyber tab for ${sheet.item.name}`);
      return;
    }

    // Fallback pour les objets sans onglet cyber - ajouter une checkbox basique
    // Ne pas ajouter si déjà présent
    if (html.find('.cyber-checkbox-group').length > 0) {
      return;
    }

    // Find a good place to insert the checkbox (after description or at the end of form)
    let insertPoint = html.find('.editor-content').parent();
    if (!insertPoint.length) {
      insertPoint = html.find('form .tab.active').first();
    }

    if (insertPoint.length) {
      // Vérifier la valeur actuelle pour éviter l'erreur 'in' operator
      const isCyber = Boolean(sheet.item.system.cyber);
      
      const cyberCheckboxHTML = `
        <div class="form-group cyber-checkbox-group" style="border: 1px solid #666; padding: 10px; margin: 10px 0; background: rgba(74, 158, 255, 0.1);">
          <label style="font-weight: bold; color: #4a9eff;">
            <i class="fas fa-microchip"></i> Cybermod personnalisé
          </label>
          <div class="form-fields" style="margin-top: 5px;">
            <label style="display: flex; align-items: center; gap: 8px; font-size: 14px;">
              <input type="checkbox" name="system.cyber" ${isCyber ? 'checked' : ''} data-dtype="Boolean" />
              Cet objet est cybernétique
            </label>
          </div>
          <div class="cyber-info" style="font-size: 11px; color: #ccc; margin-top: 5px;">
            Les objets cybernétiques peuvent être installés comme cyberware ou slickware
          </div>
        </div>
      `;

      insertPoint.append(cyberCheckboxHTML);
      this.log(`Added fallback cyber checkbox to ${sheet.item.name}`);
    }
  }

  /**
   * Add cybermod specific fields to items marked as cyber
   */
  async _addCybermodsFields(sheet, html, data) {
    // MODIFICATION: Ne plus ajouter dans la description, utiliser l'onglet cyber
    // Vérifier si l'onglet cyber existe
    const cyberTab = html.find('a[data-tab="cyber"]');
    const cyberTabContent = html.find('.tab[data-tab="cyber"]');
    
    if (cyberTab.length > 0 && cyberTabContent.length > 0) {
      // Si l'onglet cyber existe, les propriétés sont gérées par le template cyber
      this.log(`Using existing cyber tab for fields of ${sheet.item.name}`);
      return;
    }

    // Fallback pour les objets sans onglet cyber - ajouter les champs dans la description
    // Ne pas ajouter si déjà présent
    if (html.find('.cybermods-fields').length > 0) {
      return;
    }

    // Find insertion point after the cyber checkbox
    let insertPoint = html.find('.cyber-checkbox-group');
    if (!insertPoint.length) {
      insertPoint = html.find('.tab.active').first();
    }

    if (insertPoint.length) {
      // Sécuriser l'accès aux propriétés pour éviter les erreurs
      const item = sheet.item;
      const system = item.system || {};
      const cyberType = system.cyberType || '';
      const cyberSlots = system.cyberSlots || 1;
      const slickSlots = system.slickSlots || 1;
      const installed = Boolean(system.installed);
      const canOverclock = Boolean(system.canOverclock);
      const malfunctioning = Boolean(system.malfunctioning);
      const installCost = system.installCost || 0;
      const installDifficulty = system.installDifficulty || 0;

      const cyberFieldsHTML = `
        <div class="form-group cybermods-fields" style="border: 1px solid #4a9eff; padding: 15px; margin: 10px 0; background: rgba(74, 158, 255, 0.15);">
          <h3 style="margin: 0 0 10px 0; color: #4a9eff; border-bottom: 1px solid #4a9eff; padding-bottom: 5px;">
            <i class="fas fa-cog"></i> Propriétés du Cybermod (Fallback)
          </h3>
          
          <p style="color: #ff6b6b; font-size: 12px; margin-bottom: 15px;">
            <i class="fas fa-exclamation-triangle"></i> Utilisez l'onglet Cyber pour une meilleure gestion
          </p>
          
          <!-- Cybermod Type -->
          <div class="form-group">
            <label style="font-weight: bold;">Type de Cybermod</label>
            <select name="system.cyberType" style="width: 100%;" data-dtype="String">
              <option value="">Objet cyber normal</option>
              <option value="cyberware" ${cyberType === 'cyberware' ? 'selected' : ''}>Cyberware</option>
              <option value="slickware" ${cyberType === 'slickware' ? 'selected' : ''}>Slickware</option>
            </select>
          </div>

          <!-- Installation Status -->
          <div class="form-group">
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" name="system.installed" ${installed ? 'checked' : ''} data-dtype="Boolean" />
              <span style="font-weight: bold;">Installé</span>
            </label>
            <small style="color: #ccc; margin-left: 20px;">Indique si ce cybermod est installé</small>
          </div>

          <!-- Installation Cost -->
          <div class="form-group">
            <label style="font-weight: bold;">Coût d'installation</label>
            <input type="number" name="system.installCost" value="${installCost}" min="0" style="width: 120px;" data-dtype="Number" />
            <small style="color: #ccc;">crédits</small>
          </div>

        </div>
      `;

      if (insertPoint.is('.cyber-checkbox-group')) {
        insertPoint.after(cyberFieldsHTML);
      } else {
        insertPoint.append(cyberFieldsHTML);
      }

      this.log(`Added fallback cybermod fields to ${sheet.item.name}`);
    }
  }
}