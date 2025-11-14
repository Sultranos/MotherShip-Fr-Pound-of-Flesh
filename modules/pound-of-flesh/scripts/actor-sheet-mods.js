/**
 * Actor Sheet Modifications for Cybermods
 * Simplified to work with cyber-enabled items instead of separate cyber tabs
 */
export class ActorSheetModifications {
  constructor() {
    this.debug = false;
  }

  initialize() {
    this.debug = game.settings.get('pound-of-flesh', 'debugMode') || false;
    this.log('ActorSheetModifications initialized');
    
    // Hook into actor sheet rendering - UN SEUL hook pour éviter les doublons
    Hooks.on('renderMothershipActorSheet', this.onRenderActorSheet.bind(this));
    
    // Hook into item addition on actor sheets
    Hooks.on('dropActorSheetData', this.onDropActorSheetData.bind(this));
    
    if (this.debug) {
      console.log('Pound of Flesh | ActorSheetModifications hooks registered - DEBUG ACTIVÉ');
    }
  }

  log(message) {
    if (this.debug) {
      console.log(`Pound of Flesh | ActorSheetMods | ${message}`);
    }
  }

  /**
   * Modify actor sheet when rendered
   */
  async onRenderActorSheet(sheet, html, data) {
    if (this.debug) {
      console.log('🔍 Pound of Flesh | onRenderActorSheet called');
      console.log('System ID:', game.system.id);
      console.log('Actor type:', sheet.actor.type);
      console.log('Sheet class:', sheet.constructor.name);
    }
    
    // Only modify character sheets for Mothership-Fr system
    if (game.system.id !== 'mothership-fr') {
      if (this.debug) console.log('❌ Not Mothership-Fr system, aborting');
      return;
    }
    
    // Vérification plus robuste du type d'acteur
    if (sheet.actor.type !== 'character' && sheet.actor.type !== 'contractor') {
      if (this.debug) console.log('❌ Not character/contractor type, aborting');
      return;
    }

    this.log(`Rendering actor sheet for ${sheet.actor.name} (type: ${sheet.actor.type})`);

    // CRITICAL: Filter cyber items from regular item lists
    this._filterCyberItemsFromRegularTabs(sheet, html, data);

    // TOUJOURS ajouter l'onglet cyber - supprimer la vérification qui bloque
    if (this.debug) console.log('🚀 Starting cyber tab injection...');
    
    // Add cyber tab to the actor sheet
    await this._addCyberTab(sheet, html, data);

    // Add cyber stats display
    this._addCyberStatsDisplay(sheet, html, data);
    
    // Add event listeners
    this._addCyberListeners(sheet, html);
    
    if (this.debug) console.log('✅ Cyber modifications applied successfully');
  }

  /**
   * Filter cyber items from regular item lists
   * Prevents cyber items from appearing in weapons/items tabs
   */
  _filterCyberItemsFromRegularTabs(sheet, html, data) {
    try {
      if (this.debug) console.log('🧹 Filtering cyber items from regular tabs...');
      
      // Filter cyber items from gear list (items tab)
      if (data.gear) {
        const originalGearCount = data.gear.length;
        data.gear = data.gear.filter(item => !this._isCyberItem(item));
        if (this.debug) console.log(`Filtered ${originalGearCount - data.gear.length} cyber items from gear list`);
      }

      // Filter cyber items from weapons list (weapons tab) 
      if (data.weapons) {
        const originalWeaponsCount = data.weapons.length;
        data.weapons = data.weapons.filter(item => !this._isCyberItem(item));
        if (this.debug) console.log(`Filtered ${originalWeaponsCount - data.weapons.length} cyber weapons from weapons list`);
      }

      // Also remove any cyber items that might be rendered in the DOM
      html.find('.tab.items .item').each((index, element) => {
        const itemElement = $(element);
        const itemId = itemElement.data('item-id');
        if (itemId) {
          const item = sheet.actor.items.get(itemId);
          if (item && this._isCyberItem(item)) {
            if (this.debug) console.log(`Removing cyber item ${item.name} from items DOM`);
            itemElement.remove();
          }
        }
      });

      html.find('.tab.weapons .item').each((index, element) => {
        const itemElement = $(element);
        const itemId = itemElement.data('item-id');
        if (itemId) {
          const item = sheet.actor.items.get(itemId);
          if (item && this._isCyberItem(item)) {
            if (this.debug) console.log(`Removing cyber weapon ${item.name} from weapons DOM`);
            itemElement.remove();
          }
        }
      });

    } catch (error) {
      console.error('Error filtering cyber items:', error);
    }
  }

  /**
   * Check if an item is a cyber item (cyberware or slickware)
   */
  _isCyberItem(item) {
    if (!item || !item.system) return false;
    
    // Check for cyber flags
    if (item.flags && item.flags['pound-of-flesh']) {
      if (item.flags['pound-of-flesh'].isCyberware || item.flags['pound-of-flesh'].isSlickware) {
        return true;
      }
    }

    // Check for cyber pack sources
    if (item.pack) {
      if (item.pack.includes('cyberware') || item.pack.includes('slickware')) {
        return true;
      }
    }

    // Check system fields for cyber properties
    const systemData = item.system;
    if (systemData.cyberSlots || systemData.slickSlots || systemData.stressCost) {
      return true;
    }

    // Check item name/type patterns
    const itemName = (item.name || '').toLowerCase();
    if (itemName.includes('cyber') || itemName.includes('slick') || 
        itemName.includes('implant') || itemName.includes('augment')) {
      return true;
    }

    return false;
  }

  /**
   * Add cyber tab to the actor sheet
   */
  async _addCyberTab(sheet, html, data) {
    try {
      if (this.debug) console.log('🔧 Adding cyber tab...');
      
      // Vérifier si le tab a déjà été ajouté pour éviter les doublons
      const existingCyberTabs = html.find('a[data-tab="cybermods"]');
      const existingCyberContent = html.find('.tab.cybermods');
      
      if (existingCyberTabs.length > 0 && existingCyberContent.length > 0) {
        if (this.debug) console.log('🔄 Cyber tab already exists, updating content only');
        // Met à jour seulement le contenu sans recréer tout
        await this._updateCyberTabContent(sheet, html, data);
        return;
      }
      
      // Supprimer TOUS les onglets et contenus cyber existants avant d'en créer de nouveaux
      if (existingCyberTabs.length > 0) {
        if (this.debug) console.log(`🗑️ Removing ${existingCyberTabs.length} existing cyber tab navigation`);
        existingCyberTabs.remove();
      }
      
      if (existingCyberContent.length > 0) {
        if (this.debug) console.log(`🗑️ Removing ${existingCyberContent.length} existing cyber tab content`);
        existingCyberContent.remove();
      }
      
      // Add Cyber tab to navigation
      const tabsNav = html.find('nav.sheet-tabs');
      if (this.debug) console.log('Tab navigation found:', tabsNav.length);
      
      if (tabsNav.length) {
        const cyberTab = $(`
          <a class="tab-select" data-tab="cybermods" style="display: block !important;">
            <i class="fas fa-microchip"></i> Cyber
          </a>
        `);
        tabsNav.append(cyberTab);
        if (this.debug) console.log('✅ Cyber tab added to navigation');
      } else {
        console.error('❌ No tab navigation found!');
        return;
      }

      // Prepare data for the cyber tab template
      if (this.debug) console.log('🗃️ Preparing cyber data...');
      const cyberData = await this._prepareCyberData(sheet.actor);
      if (this.debug) console.log('Cyber data prepared:', cyberData);

      // Render the cyber tab template
      if (this.debug) console.log('🎨 Rendering cyber tab template...');
      const cyberTabHtml = await foundry.applications.handlebars.renderTemplate(
        "modules/pound-of-flesh/templates/cybermods-tab.html",
        cyberData
      );
      if (this.debug) console.log('✅ Template rendered successfully');

      // Add cyber tab content to sheet body avec style forcé
      const sheetBody = html.find('section.sheet-body');
      if (this.debug) console.log('Sheet body found:', sheetBody.length);
      if (sheetBody.length) {
        // Ajouter le contenu sans style inline pour respecter le comportement des onglets
        sheetBody.append(cyberTabHtml);
        if (this.debug) console.log('✅ Cyber tab content added to sheet body');
        
        // Les onglets seront gérés par le système standard de Foundry
        const allTabs = html.find('.tab');
        if (this.debug) console.log('Total tabs found:', allTabs.length);
      } else {
        console.error('❌ No sheet body found!');
        return;
      }

      this.log('Cyber tab added to actor sheet');
    } catch (error) {
      console.error('❌ Error adding cyber tab to actor sheet:', error);
    }
  }

  /**
   * Update cyber tab content without recreating the entire tab
   */
  async _updateCyberTabContent(sheet, html, data) {
    try {
      if (this.debug) console.log('🔄 Updating existing cyber tab content...');
      
      // Préparer les nouvelles données cyber
      const cyberData = await this._prepareCyberData(sheet.actor);
      
      // Renderer le nouveau contenu
      const template = 'modules/pound-of-flesh/templates/cybermods-tab.html';
      const newContentHtml = await renderTemplate(template, cyberData);
      
      // Remplacer le contenu existant
      const existingContent = html.find('.tab.cybermods');
      if (existingContent.length > 0) {
        existingContent.html($(newContentHtml).html());
        if (this.debug) console.log('✅ Cyber tab content updated');
      }
      
    } catch (error) {
      console.error('❌ Error updating cyber tab content:', error);
    }
  }

  /**
   * Prepare data for cyber tab template
   */
  async _prepareCyberData(actor) {
    const cyberwareManager = game.poundOfFlesh.cyberwareManager;
    
    // Calculate slots
    const slots = cyberwareManager.calculateSlots(actor);
    const installedMods = cyberwareManager.getInstalledMods(actor);
    
    // Separate cyber items by type - utiliser le gestionnaire cyberware pour une détection robuste
    const allCyberItems = actor.items.filter(item => {
      const cyberType = cyberwareManager.getCyberType(item);
      const isInstalled = item.system?.installed || 
                         item.system?.cyber?.installed || 
                         item.flags?.['pound-of-flesh']?.installed || 
                         false;
      
      if (this.debug) {
        this.log(`Item ${item.name}: type=${item.type}, cyberType=${cyberType}, installed=${isInstalled}, hasFlags=${!!item.flags?.['pound-of-flesh']}`);
      }
      return cyberType !== null;
    });
    
    const cyberware = allCyberItems.filter(item => 
      cyberwareManager.getCyberType(item) === 'cyberware'
    );
    
    const slickware = allCyberItems.filter(item => 
      cyberwareManager.getCyberType(item) === 'slickware'
    );
    
    if (this.debug) {
      this.log(`Found ${cyberware.length} cyberware items and ${slickware.length} slickware items`);
    }

    return {
      actor: actor,
      cyberSlots: {
        used: installedMods.cyberware.length,
        max: slots.cyberware
      },
      slickSlots: {
        used: installedMods.slickware.length,
        max: slots.slickware,
        hasSocket: slots.hasSlicksocket
      },
      cyberware: cyberware.map(item => {
        // Logique de détection d'installation améliorée
        const isInstalled = item.system?.installed || 
                           item.system?.cyber?.installed || 
                           item.flags?.['pound-of-flesh']?.installed || 
                           false;
        
        if (this.debug) console.log(`Pound of Flesh | ActorSheetMods | Item ${item.name}: type=${item.type}, installed=${isInstalled}`);
        
        return {
          ...item.toObject(),
          _id: item.id,
          system: {
            ...item.system,
            installed: isInstalled,
            canOverclock: item.system?.cyber?.canOverclock || false,
            cyberSlots: cyberwareManager.getCyberSlotCost(item, 'cyberware')
          }
        }
      }),
      slickware: slickware.map(item => {
        // Logique de détection d'installation améliorée
        const isInstalled = item.system?.installed || 
                           item.system?.cyber?.installed || 
                           item.flags?.['pound-of-flesh']?.installed || 
                           false;
        
        return {
          ...item.toObject(),
          _id: item.id,
          system: {
            ...item.system,
            installed: isInstalled,
            canOverclock: item.system?.cyber?.canOverclock || false,
            slickSlots: cyberwareManager.getCyberSlotCost(item, 'slickware')
          }
        }
      }),
      cyberItems: allCyberItems // Pour rétrocompatibilité
    };
  }

  /**
   * Add visual indicators for cyber items in inventory
   */
  _addCyberIndicators(sheet, html, data) {
    try {
      // Find all item entries in the inventory
      const itemElements = html.find('.items-list .item');
      
      itemElements.each((index, element) => {
        const itemId = element.dataset.itemId;
        const item = sheet.actor.items.get(itemId);
        
        if (item && (item.type === 'cyberware' || item.type === 'slickware' || item.system.cyber?.isCyber)) {
          // Add cyber indicator
          const itemElement = $(element);
          
          // Add cyber icon
          const nameElement = itemElement.find('.item-name');
          if (nameElement.length) {
            const cyberIcon = $('<i class="fas fa-microchip" style="color: #00ffff; margin-right: 5px;" title="Objet Cyber"></i>');
            nameElement.prepend(cyberIcon);
          }
          
          // Détection améliorée de l'état d'installation
          const isInstalled = item.system?.installed || 
                             item.system?.cyber?.installed || 
                             item.flags?.['pound-of-flesh']?.installed || 
                             false;
          
          // Add installed indicator
          if (isInstalled) {
            itemElement.addClass('cyber-installed');
            itemElement.css('border-left', '3px solid #00ffff');
          } else {
            itemElement.addClass('cyber-not-installed');
            itemElement.css('border-left', '3px solid #666');
          }
        }
      });
    } catch (error) {
      console.error('Error adding cyber indicators:', error);
    }
  }

  /**
   * Add cyber stats display to actor sheet
   */
  _addCyberStatsDisplay(sheet, html, data) {
    try {
      // Calculate cyber slots and usage
      const slots = game.poundOfFlesh.cyberwareManager.calculateSlots(sheet.actor);
      const installedMods = game.poundOfFlesh.cyberwareManager.getInstalledMods(sheet.actor);
      
      // Create stats display HTML
      const statsHtml = `
        <div class="cyber-stats" style="margin: 10px 0; padding: 8px; background: rgba(0,255,255,0.1); border: 1px solid #00ffff; border-radius: 3px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h4 style="margin: 0; color: #00ffff;">
              <i class="fas fa-microchip"></i> Cybermods
            </h4>
            <div style="font-size: 12px; color: #ccc;">
              Emplacements : ${installedMods.cyberware.length}/${slots.cyberware} | 
              Slickware : ${installedMods.slickware.length}/${slots.slickware}
            </div>
          </div>
        </div>
      `;
      
      // Insert after stats or before items
      const insertPoint = html.find('.stats').last() || html.find('.items').first();
      if (insertPoint.length) {
        if (html.find('.stats').last().length) {
          insertPoint.after(statsHtml);
        } else {
          insertPoint.before(statsHtml);
        }
      }
    } catch (error) {
      console.error('Error adding cyber stats display:', error);
    }
  }

  /**
   * Add cyber-related event listeners
   */
  _addCyberListeners(sheet, html) {
    this.log('Adding cyber event listeners');
    
    // Listen for item control clicks to handle cyber operations
    html.find('.item-control').off('click.cyber').on('click.cyber', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      
      this.log('Item control clicked');
      
      const li = $(event.currentTarget).closest('.item');
      const itemId = li.data('item-id');
      const item = sheet.actor.items.get(itemId);
      const action = event.currentTarget.dataset.action;
      
      this.log(`Action: ${action}, Item: ${item?.name}, ID: ${itemId}`);
      
      if (!item) {
        this.log('No item found');
        return;
      }
      
      // Handle standard actions for all items
      if (action === 'edit') {
        item.sheet.render(true);
        return;
      }
      
      if (action === 'delete') {
        const confirmed = await foundry.applications.api.DialogV2.confirm({
          window: { title: `Supprimer ${item.name}` },
          content: `<p>Êtes-vous sûr de vouloir supprimer <strong>${item.name}</strong> ?</p>`,
          yes: {
            label: "Supprimer",
            icon: '<i class="fas fa-trash"></i>'
          },
          no: {
            label: "Annuler",
            icon: '<i class="fas fa-times"></i>'
          },
          defaultYes: false
        });
        
        if (confirmed) {
          await item.delete();
          sheet.render(false);
        }
        return;
      }
      
      // Handle cyber-specific actions
      const cyberType = game.poundOfFlesh.cyberwareManager.getCyberType(item);
      if (cyberType) {
        this.log(`Handling cyber action for ${item.name} (type: ${cyberType})`);
        
        // Handle installation
        if (event.currentTarget.classList.contains('item-install')) {
          const installType = event.currentTarget.dataset.cyberType || cyberType;
          this.log(`Installing ${item.name} as ${installType}`);
          await game.poundOfFlesh.cyberwareManager.installMod(sheet.actor, item, installType);
          sheet.render(false);
          return;
        }
        
        // Handle overclock
        if (event.currentTarget.classList.contains('item-overclock')) {
          this.log(`Overclocking ${item.name}`);
          await this._showOverclockDialog(sheet.actor, item);
          return;
        }
      }
    });

    // Listen for cyber-specific controls in the cyber tab
    html.find('.cyber-add').off('click.cyberadd').on('click.cyberadd', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      
      const cyberType = event.currentTarget.dataset.cyberType;
      this.log(`Adding new cyber item of type: ${cyberType}`);
      await this._showCyberInstallDialog(sheet.actor, cyberType);
    });

    // Listen for item name clicks in cyber tab (weapon attack or description)
    html.find('.cybermods .list-roll').off('click.cyberroll').on('click.cyberroll', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      
      const li = $(event.currentTarget).closest('.item');
      const itemId = li.data('item-id');
      const item = sheet.actor.items.get(itemId);
      
      if (item) {
        // Si c'est une arme cyber, déclencher l'attaque comme dans l'onglet Armes
        if (item.type === 'weapon') {
          this.log(`Triggering weapon attack for cyber weapon: ${item.name}`);
          // Utiliser la même logique que Mothership-Fr pour les attaques d'armes
          let itemData;
          if (game.release.generation >= 12) {
            itemData = foundry.utils.duplicate(item);
          } else {
            itemData = duplicate(item);
          }
          sheet.actor.rollCheck(null, 'low', 'combat', null, null, itemData);
        } else {
          // Sinon, afficher la description comme avant
          this.log(`Rolling description for cyber item: ${item.name}`);
          
          // Send item description to chat - V13 compatible version
          const messageContent = await foundry.applications.handlebars.renderTemplate(
            "modules/pound-of-flesh/templates/pound-of-flesh-chat.hbs",
            {
              msgHeader: item.name,
              msgImgPath: item.img || 'icons/svg/item-bag.svg',
              flavorText: item.system.description || "Aucune description disponible",
              needsDesc: false, // Description déjà incluse dans flavorText
              actor: sheet.actor,
              item: item
            }
          );
          
          // Force using modern message creation without deprecated hooks
          const messageData = {
            content: messageContent,
            speaker: ChatMessage.getSpeaker({ actor: sheet.actor }),
            style: CONST.CHAT_MESSAGE_STYLES.OTHER  // v13 compatible
          };
          
          // Create message with explicit flag to avoid hook conflicts
          await ChatMessage.create(messageData, {
            displayCard: false  // Avoid triggering render hooks immediately
          });
        }
      }
    });

    this.log('Cyber event listeners added');
  }

  /**
   * Show dialog for adding new cyber items
   */
  async _showCyberInstallDialog(actor, cyberType) {
    const typeName = cyberType === 'cyberware' ? 'Cyberware' : 'Slickware';
    const content = `
      <div style="text-align: center; padding: 20px;">
        <h3><i class="fas fa-microchip" style="color: #00ffff;"></i> Installer ${typeName}</h3>
        <p>Sélectionnez un objet à convertir en ${typeName} :</p>
        <div style="margin: 15px 0;">
          <select id="item-select" style="width: 100%; padding: 5px;">
            <option value="">-- Choisir un objet --</option>
            ${actor.items.filter(i => !i.system.cyber?.isCyber).map(item => 
              `<option value="${item.id}">${item.name} (${item.type})</option>`
            ).join('')}
          </select>
        </div>
        <p><small>L'objet sélectionné sera converti en ${typeName}</small></p>
      </div>
    `;

    const result = await foundry.applications.api.DialogV2.wait({
      window: { title: `Installer ${typeName}` },
      content: content,
      buttons: [
        {
          action: "install",
          label: "Installer", 
          icon: '<i class="fas fa-wrench"></i>',
          callback: (event, button, dialog) => {
            // API DialogV2 - accès aux données du formulaire
            try {
              let form = null;
              if (dialog?.element?.[0]) {
                form = dialog.element[0].querySelector('form') || dialog.element[0];
              } else if (event?.target?.closest?.('form')) {
                form = event.target.closest('form');
              } else if (dialog?.form) {
                form = dialog.form;
              }
              
              if (form) {
                const selectElement = form.querySelector('#item-select');
                if (selectElement) {
                  return selectElement.value;
                }
              }
            } catch (err) {
              console.warn('Pound of Flesh | Could not access item selection:', err);
            }
            return null;
          }
        },
        {
          action: "cancel",
          label: "Annuler",
          icon: '<i class="fas fa-times"></i>',
          callback: () => null
        }
      ],
      default: "install"
    });

    if (result) {
      const item = actor.items.get(result);
      if (item) {
        await game.poundOfFlesh.cyberwareManager.convertToCyber(item, cyberType);
        ui.notifications.info(`${item.name} converti en ${typeName}`);
      }
    }
  }

  /**
   * Show overclock dialog
   */
  async _showOverclockDialog(actor, item) {
    const content = `
      <div style="text-align: center; padding: 20px;">
        <h3><i class="fas fa-bolt" style="color: #ffaa00;"></i> Overclocker ${item.name}</h3>
        <p>Niveau d'overclock actuel : ${item.system.cyber.overclock?.level || 0}</p>
        <div style="margin: 15px 0;">
          <label for="overclock-level">Nouveau niveau (0-3) :</label>
          <input type="number" id="overclock-level" min="0" max="3" 
                 value="${item.system.cyber.overclock?.level || 0}" 
                 style="width: 60px; margin-left: 10px;">
        </div>
        <p><small style="color: #ffaa00;">Attention : L'overclock peut causer du stress supplémentaire</small></p>
      </div>
    `;

    const result = await foundry.applications.api.DialogV2.wait({
      window: { title: "Overclock" },
      content: content,
      buttons: [
        {
          action: "apply",
          label: "Appliquer",
          icon: '<i class="fas fa-bolt"></i>',
          callback: (event, button, dialog) => {
            // API DialogV2 - accès aux données du formulaire
            try {
              let form = null;
              if (dialog?.element?.[0]) {
                form = dialog.element[0].querySelector('form') || dialog.element[0];
              } else if (event?.target?.closest?.('form')) {
                form = event.target.closest('form');
              } else if (dialog?.form) {
                form = dialog.form;
              }
              
              if (form) {
                const levelElement = form.querySelector('#overclock-level');
                if (levelElement) {
                  return parseInt(levelElement.value);
                }
              }
            } catch (err) {
              console.warn('Pound of Flesh | Could not access overclock level:', err);
            }
            return null;
          }
        },
        {
          action: "cancel",
          label: "Annuler", 
          icon: '<i class="fas fa-times"></i>',
          callback: () => null
        }
      ],
      default: "apply"
    });

    if (result !== null) {
      await item.update({
        'system.cyber.overclock.level': result
      });
      ui.notifications.info(`Overclock de ${item.name} défini à ${result}`);
    }
  }

  /**
   * Handle when items are dropped onto actor sheet
   */
  async onDropActorSheetData(actor, sheet, data) {
    if (data.type !== 'Item') return;
    
    try {
      const item = await Item.fromDropData(data);
      if (item && item.system.cyber?.isCyber) {
        this.log(`Cyber item dropped: ${item.name}`);
        
        // Show installation dialog if not auto-installing
        setTimeout(async () => {
          const addedItem = actor.items.find(i => i.name === item.name && i.type === item.type);
          if (addedItem && !addedItem.system.cyber.installed) {
            await this._showInstallationDialog(actor, addedItem);
          }
        }, 500); // Wait for item to be added
      }
    } catch (error) {
      console.error('Error handling cyber item drop:', error);
    }
  }

  /**
   * Show installation dialog for cyber items
   */
  async _showInstallationDialog(actor, item) {
    const cyberType = game.poundOfFlesh.cyberwareManager.getCyberType(item);
    const content = `
      <div style="text-align: center; padding: 10px;">
        <h3><i class="fas fa-microchip" style="color: #00ffff;"></i> ${item.name}</h3>
        <p>Voulez-vous installer cet objet cyber maintenant ?</p>
        <p><small>Type: ${cyberType === 'cyberware' ? 'Cyberware' : 'Slickware'}</small></p>
      </div>
    `;

    const result = await foundry.applications.api.DialogV2.confirm({
      window: { title: "Installation Cyber" },
      content: content,
      yes: {
        label: "Installer",
        icon: '<i class="fas fa-wrench"></i>'
      },
      no: {
        label: "Annuler", 
        icon: '<i class="fas fa-times"></i>'
      },
      defaultYes: false
    });

    if (result) {
      await game.poundOfFlesh.cyberwareManager.installMod(actor, item, cyberType);
    }
  }
}