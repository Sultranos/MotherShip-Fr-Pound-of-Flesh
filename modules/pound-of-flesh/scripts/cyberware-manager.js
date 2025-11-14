/**
 * Cyberware Manager - Handles all cyberware and slickware mechanics
 */
export class CyberwareManager {
  constructor() {
    this.debug = false;
  }

  initialize() {
    this.debug = game.settings.get('pound-of-flesh', 'debugMode') || false;
    
    // Initialiser les caches
    this._slotsCache = new Map();
    this._slicksocketCache = new Map();
    
    this.log('CyberwareManager initialized');
  }

  log(message) {
    if (this.debug) {
      console.log(`Pound of Flesh | CyberwareManager | ${message}`);
    }
  }

  /**
   * Check if an item is a cybermod (regardless of type)
   */
  isCybermod(item) {
    // Vérifier d'abord les propriétés système
    if (item.system?.cyber?.isCyber === true || 
        item.system?.cyber === true || 
        item.system?.cyberware === true || 
        item.system?.slickware === true ||
        item.system?.cyberType) {
      return true;
    }

    // Fallback: reconnaître par nom si les propriétés système sont manquantes
    const itemName = item.name?.toLowerCase() || '';
    const cyberwareKeywords = [
      'interface de piratage', 'hack interface',
      'prise slick', 'slicksocket',
      'yeux améliorés', 'improved eyes',
      'analyseur médical', 'medical scanner',
      'système ogre', 'ogre system',
      'muscles synthétiques', 'synth muscle',
      'émetteur', 'transmitter',
      'boîte noire', 'black box',
      'peau protectrice', 'cloakskin',
      'grand interrupteur', 'big switch',
      'crocs', 'fangs',
      'canon à main', 'handcannon',
      'lame intégrée', 'integrated blade',
      'cyberware', 'slickware', 'cyber'
    ];

    return cyberwareKeywords.some(keyword => itemName.includes(keyword));
  }

  /**
   * Get the cyber type of an item (cyberware/slickware)
   */
  getCyberType(item) {
    // Vérifier d'abord si l'item a été installé comme cybermod via flags
    const installationFlag = item.flags?.['pound-of-flesh']?.installationType;
    if (installationFlag) {
      return installationFlag; // 'cyberware' ou 'slickware'
    }
    
    // Vérifier les propriétés système d'abord
    if (item.system?.cyber?.isCyber) {
      // Déterminer le type basé sur cyberType ou type d'item
      if (item.system.cyber.cyberType) {
        return item.system.cyber.cyberType;
      }
      if (item.type === 'weapon' || item.type === 'armor') {
        return 'cyberware'; // Physical augmentations
      }
      return 'cyberware'; // Default to cyberware
    }
    if (item.system?.cyberType) {
      return item.system.cyberType;
    }
    if (item.system?.cyberware === true) {
      return 'cyberware';
    }
    if (item.system?.slickware === true) {
      return 'slickware';
    }
    
    // Vérifier si l'item a été marqué comme cyber installé
    if (item.system?.cyber === true) {
      return 'cyberware'; // Default pour les items cyber
    }

    // Fallback: détecter par nom si les propriétés sont manquantes
    const itemName = item.name?.toLowerCase() || '';
    
    // Items spécifiquement slickware
    const slickwareNames = [
      'interface de piratage', 'hack interface',
      'prise slick', 'slicksocket'
    ];
    
    // Items spécifiquement cyberware (par nom)
    const cyberwareNames = [
      'yeux améliorés', 'improved eyes',
      'analyseur médical', 'medical scanner',
      'système ogre', 'ogre system',
      'muscles synthétiques', 'synth muscle',
      'émetteur', 'transmitter',
      'boîte noire', 'black box',
      'peau protectrice', 'cloakskin',
      'grand interrupteur', 'big switch',
      'crocs', 'fangs', // Ajouter Crocs ici
      'canon à main', 'handcannon',
      'lame intégrée', 'integrated blade',
      'neural interface', 'interface neurale' // Interface neurale
    ];

    // Vérifier les noms spécifiques d'abord
    if (slickwareNames.some(name => itemName.includes(name))) {
      return 'slickware';
    }
    if (cyberwareNames.some(name => itemName.includes(name))) {
      return 'cyberware';
    }
    
    // Vérifier si l'objet a des marqueurs cyber explicites
    if (item.system?.cyber === true || item.system?.isCyber === true) {
      return 'cyberware';
    }

    // Si aucun type spécifique détecté et que c'est une arme/armure cyber
    if ((item.type === 'weapon' || item.type === 'armor') && 
        (item.system?.cyber || item.system?.isCyber || item.flags?.['pound-of-flesh'])) {
      return 'cyberware'; // Physical augmentations = cyberware
    }

    // Retourner null pour les objets normaux (non-cyber)
    return null;
  }

  /**
   * Check if an item can be installed as cyberware
   */
  canInstallAsCyber(item) {
    const cyberType = this.getCyberType(item);
    const isNotInstalled = !item.system?.cyber?.installed && !item.system?.installed;
    return cyberType !== null && isNotInstalled;
  }

  /**
   * Get all cybermod-capable items from an actor
   */
  getCyberCapableItems(actor) {
    return actor.items.filter(item => this.getCyberType(item) !== null);
  }

  /**
   * Get installable cybermods from an actor (not yet installed)
   */
  getInstallableCybermods(actor) {
    return actor.items.filter(item => this.canInstallAsCyber(item));
  }

  /**
   * Get the cyber slot cost for an item
   */
  getCyberSlotCost(item, type) {
    if (type === 'cyberware') {
      return item.system?.cyberSlots || 1;
    } else if (type === 'slickware') {
      return item.system?.slickSlots || 1;
    }
    return 1;
  }

  /**
   * Calculate available cyberware and slickware slots for an actor
   */
  calculateSlots(actor) {
    // Cache pour éviter les recalculs inutiles
    const cacheKey = `${actor.id}-slots`;
    const cached = this._slotsCache?.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < 2000) { // Cache 2 secondes
      return cached.data;
    }
    
    const stats = actor.system.stats || {};
    const strength = stats.strength?.value || 0;
    const intellect = stats.intellect?.value || 0;

    // Cyberware slots = Strength / 10 (rounded down)
    const cyberwareSlots = Math.floor(strength / 10);

    // Slickware slots = Intellect / 10 (rounded down), but only if has Slicksocket
    let slickwareSlots = Math.floor(intellect / 10);
    
    // Check if actor has a Slicksocket (utilise le cache)
    const hasSlicksocket = this.hasSlicksocket(actor);
    if (!hasSlicksocket) {
      slickwareSlots = 0;
    }

    const result = {
      cyberware: cyberwareSlots,
      slickware: slickwareSlots,
      hasSlicksocket: hasSlicksocket
    };
    
    // Initialiser le cache si nécessaire
    if (!this._slotsCache) {
      this._slotsCache = new Map();
    }
    
    // Stocker en cache
    this._slotsCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    if (this.debug) {
      this.log(`Calculated slots for ${actor.name}: Cyberware ${cyberwareSlots}, Slickware ${slickwareSlots}`);
    }

    return result;
  }

  /**
   * Check if actor has a Slicksocket item
   */
  hasSlicksocket(actor) {
    // Cache pour éviter les recalculs multiples
    const cacheKey = `${actor.id}-slicksocket`;
    const cached = this._slicksocketCache?.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < 5000) { // Cache 5 secondes
      return cached.data;
    }
    
    const hasSocket = actor.items.some(item => {
      const name = item.name?.toLowerCase() || '';
      const desc = item.system?.description?.toLowerCase() || '';
      
      // Vérifier si l'item est installé ET est une slicksocket
      const isInstalled = item.system?.installed || item.system?.cyber?.installed;
      
      // Support pour les noms anglais et français + patterns étendus
      const slicksocketPatterns = [
        'slicksocket',
        'prise slick',
        'interface de piratage',
        'interface piratage', 
        'piratage interface',
        'slick socket',
        'socket slick',
        'neural interface',
        'interface neurale',
        'hack interface',
        'piratage',
        'hacking interface'
      ];
      
      const isSlicksocket = slicksocketPatterns.some(pattern => 
        name.includes(pattern) || desc.includes(pattern)
      );
      
      if (this.debug && isSlicksocket) {
        this.log(`Checking ${item.name} for slicksocket: isSlicksocket=${isSlicksocket}, isInstalled=${isInstalled}`);
      }
      
      return isSlicksocket && isInstalled;
    });
    
    // Initialiser le cache si nécessaire
    if (!this._slicksocketCache) {
      this._slicksocketCache = new Map();
    }
    
    // Stocker en cache
    this._slicksocketCache.set(cacheKey, {
      data: hasSocket,
      timestamp: Date.now()
    });
    
    return hasSocket;
  }

  /**
   * Check if an item is a skillware
   */
  isSkillware(item) {
    const name = item.name?.toLowerCase() || '';
    const desc = item.system?.description?.toLowerCase() || '';
    
    // Patterns pour détecter les skillwares selon leur rang
    const skillwarePatterns = [
      'skillware',
      'skill ware',
      'compétence logicielle',
      'module de compétence',
      'expertise logicielle'
    ];
    
    return skillwarePatterns.some(pattern => 
      name.includes(pattern) || desc.includes(pattern)
    );
  }

  /**
   * Get skillware rank from item name/description
   */
  getSkillwareRank(item) {
    const name = item.name?.toLowerCase() || '';
    const desc = item.system?.description?.toLowerCase() || '';
    const text = `${name} ${desc}`;
    
    // Détecter le rang par le nom ou description
    if (text.includes('expert') || text.includes('rank 3') || text.includes('rang 3') || text.includes('niveau 3')) {
      return 3;
    }
    if (text.includes('trained') || text.includes('rank 2') || text.includes('rang 2') || text.includes('niveau 2') || text.includes('entrainé')) {
      return 2;
    }
    if (text.includes('untrained') || text.includes('rank 1') || text.includes('rang 1') || text.includes('niveau 1') || text.includes('non-entrainé')) {
      return 1;
    }
    
    // Essayer de détecter par coût ou autre indication
    const cost = item.system?.cost || 0;
    if (cost >= 30000) return 3; // Expert
    if (cost >= 15000) return 2; // Trained
    return 1; // Untrained par défaut
  }

  /**
   * Get available skills for a given rank
   */
  getSkillsByRank(rank) {
    // Liste des compétences du système Mothership-Fr par rang
    const skillsByRank = {
      1: [ // Untrained skills
        'Intellect', 'Speed', 'Strength', 'Combat'
      ],
      2: [ // Trained skills
        'Athletics', 'Firearms', 'Rimwise', 'Zero-G', 'Art', 'Astrogation', 
        'Botany', 'Chemistry', 'Engineering', 'Geology', 'Mathematics', 'Medicine', 
        'Pathology', 'Physics', 'Psychology', 'Theology', 'Linguistics', 'Computers',
        'Hacking', 'Industrial Equipment', 'Military Training', 'Piloting', 'Tactics'
      ],
      3: [ // Expert skills  
        'Command', 'Explosives', 'Jury-Rigging', 'Mysticism', 'Hyperspace', 'Xenobiology'
      ]
    };
    
    // Retourner toutes les compétences jusqu'au rang spécifié
    let availableSkills = [];
    for (let r = 1; r <= rank; r++) {
      availableSkills = availableSkills.concat(skillsByRank[r] || []);
    }
    
    return availableSkills;
  }

  /**
   * Handle skillware installation - show skill selection dialog
   */
  async handleSkillwareInstallation(actor, skillware) {
    const rank = this.getSkillwareRank(skillware);
    const availableSkills = this.getSkillsByRank(rank);
    
    if (availableSkills.length === 0) {
      ui.notifications.warn("Aucune compétence disponible pour ce Skillware");
      return;
    }
    
    // Interface de sélection des compétences compatible avec Mothership-Fr
    const skillChoice = await foundry.applications.api.DialogV2.wait({
      window: { title: `Sélection Compétence - ${skillware.name}` },
      position: { width: 500, height: 400 },
      content: `
        <div style="padding: 15px; line-height: 1.6;">
          <h3><i class="fas fa-brain" style="color: #4caf50;"></i> Skillware ${this.getRankName(rank)}</h3>
          
          <p>Sélectionnez la compétence que ce Skillware va améliorer :</p>
          
          <div style="background: rgba(74, 158, 255, 0.1); border: 1px solid #4a9eff; padding: 15px; margin: 15px 0; border-radius: 4px;">
            <h4 style="margin: 0 0 10px 0; color: #4a9eff;">📋 Compétences Disponibles (Rang ${rank}) :</h4>
            <select id="skill-selection" style="width: 100%; padding: 8px; font-size: 14px;">
              <option value="">-- Choisir une compétence --</option>
              ${availableSkills.map(skill => 
                `<option value="${skill}">${skill}</option>`
              ).join('')}
            </select>
          </div>
          
          <div style="background: rgba(255, 193, 7, 0.1); border: 1px solid #ffc107; padding: 10px; border-radius: 4px; font-size: 12px;">
            <p><strong>Effet :</strong> La compétence sélectionnée sera automatiquement ajoutée à votre fiche de personnage.</p>
          </div>
        </div>
      `,
      buttons: [
        {
          action: "confirm",
          label: "Confirmer",
          icon: '<i class="fas fa-check"></i>',
          callback: (event, button, dialog) => {
            // Dans l'API DialogV2, accès aux données du formulaire différent
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
                const selectElement = form.querySelector('#skill-selection');
                if (selectElement) {
                  return selectElement.value || null;
                }
              }
            } catch (err) {
              console.warn('Pound of Flesh | Could not access skill selection:', err);
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
      default: "confirm"
    });

    if (skillChoice) {
      await this.applySkillwareEffect(actor, skillware, skillChoice, rank);
    } else {
      ui.notifications.warn("Aucune compétence sélectionnée - Skillware installé mais inactif");
    }
  }

  /**
   * Get rank name for display
   */
  getRankName(rank) {
    switch(rank) {
      case 1: return "Untrained";
      case 2: return "Trained"; 
      case 3: return "Expert";
      default: return "Unknown";
    }
  }

  /**
   * Apply skillware effect to actor
   */
  async applySkillwareEffect(actor, skillware, skillName, rank) {
    try {
      // Marquer le skillware avec la compétence choisie
      await skillware.update({
        'flags.pound-of-flesh.selectedSkill': skillName,
        'flags.pound-of-flesh.skillRank': rank,
        'system.description': skillware.system.description + 
          `\n<p><strong>Compétence Active :</strong> ${skillName} (Rang ${rank})</p>`
      });
      
      // Ajouter la compétence à l'acteur si elle n'existe pas déjà
      const existingSkill = actor.items.find(item => 
        item.type === 'skill' && item.name === skillName
      );
      
      if (!existingSkill) {
        // Créer la compétence
        const skillData = {
          name: skillName,
          type: 'skill',
          img: 'icons/svg/upgrade.svg',
          system: {
            description: `Compétence fournie par ${skillware.name}`,
            trained: rank >= 2,
            expert: rank >= 3
          },
          flags: {
            'pound-of-flesh': {
              grantedBySkillware: skillware.id,
              skillwareRank: rank
            }
          }
        };
        
        await actor.createEmbeddedDocuments('Item', [skillData]);
        
        ui.notifications.info(`Compétence ${skillName} ajoutée grâce au Skillware`);
      } else {
        ui.notifications.warn(`La compétence ${skillName} existe déjà`);
      }
      
    } catch (error) {
      console.error('Erreur lors de l\'application de l\'effet Skillware:', error);
      ui.notifications.error("Erreur lors de l'application de l'effet Skillware");
    }
  }

  /**
   * Check cyber prerequisites for an item
   */
  checkCyberPrerequisites(actor, requirementsString) {
    if (!requirementsString || requirementsString.trim() === "") {
      return []; // No requirements
    }

    // Parse requirements (comma-separated)
    const requirements = requirementsString.split(',').map(req => req.trim().toLowerCase());
    const missingPrereqs = [];

    for (const requirement of requirements) {
      let hasPrereq = false;

      // Check if actor has any item that matches this requirement
      for (const item of actor.items) {
        const itemName = item.name?.toLowerCase() || '';
        const itemDesc = item.system?.description?.toLowerCase() || '';
        
        // Check if item name contains the requirement
        if (itemName.includes(requirement)) {
          // For cyberware, also check if it's installed
          if (item.system?.cyber && item.system?.installed) {
            hasPrereq = true;
            break;
          } 
          // For non-cyber items, just check existence
          else if (!item.system?.cyber) {
            hasPrereq = true;
            break;
          }
        }
        
        // Also check description for keyword matches
        if (itemDesc.includes(requirement)) {
          hasPrereq = true;
          break;
        }
      }

      // Special cases for common requirements
      if (!hasPrereq) {
        // Check for "bras cybernétique" variations
        if (requirement.includes('bras') || requirement.includes('arm')) {
          hasPrereq = actor.items.some(item => {
            const name = item.name?.toLowerCase() || '';
            const installed = item.system?.installed || false;
            return (name.includes('bras') || name.includes('arm')) && 
                   item.system?.cyber && installed;
          });
        }
        
        // Check for "interface neurale" variations  
        if (requirement.includes('interface') || requirement.includes('neural')) {
          hasPrereq = actor.items.some(item => {
            const name = item.name?.toLowerCase() || '';
            const installed = item.system?.installed || false;
            return (name.includes('interface') || name.includes('neural')) && 
                   item.system?.cyber && installed;
          });
        }

        // Check for "système" variations
        if (requirement.includes('système') || requirement.includes('system')) {
          hasPrereq = actor.items.some(item => {
            const name = item.name?.toLowerCase() || '';
            const installed = item.system?.installed || false;
            return (name.includes('système') || name.includes('system')) && 
                   item.system?.cyber && installed;
          });
        }
      }

      if (!hasPrereq) {
        // Add the original requirement text to missing list
        const originalReq = requirementsString.split(',').find(r => 
          r.trim().toLowerCase() === requirement
        )?.trim() || requirement;
        missingPrereqs.push(originalReq);
      }
    }

    return missingPrereqs;
  }

  /**
   * Get installed cybermods for an actor
   */
  getInstalledMods(actor) {
    // Logique unifiée de détection des mods cyber installés
    const cyberware = actor.items.filter(item => {
      // Détection améliorée du type cyberware
      const isCyberwareType = item.type === 'cyberware' || 
                             item.system?.cyberType === 'cyberware' || 
                             item.system?.cyberware === true ||
                             item.flags?.["pound-of-flesh"]?.installationType === "cyberware";
      
      // Détection améliorée de l'installation
      const isInstalled = item.system?.installed === true ||
                         item.system?.cyber?.installed === true ||
                         item.flags?.['pound-of-flesh']?.installed === true;
      
      return isCyberwareType && isInstalled;
    });
    
    const slickware = actor.items.filter(item => {
      // Détection améliorée du type slickware
      const isSlickwareType = item.type === 'slickware' || 
                             item.system?.cyberType === 'slickware' || 
                             item.system?.slickware === true ||
                             item.flags?.["pound-of-flesh"]?.installationType === "slickware";
      
      // Détection améliorée de l'installation
      const isInstalled = item.system?.installed === true ||
                         item.system?.cyber?.installed === true ||
                         item.flags?.['pound-of-flesh']?.installed === true;
      
      return isSlickwareType && isInstalled;
    });

    const slots = this.calculateSlots(actor);
    
    // Calculate overclock level
    const usedCyberware = cyberware.length;
    const usedSlickware = slickware.length;
    const totalOverclock = Math.max(0, 
      (usedCyberware - slots.cyberware) + (usedSlickware - slots.slickware)
    );

    return {
      cyberware: cyberware,
      slickware: slickware,
      slots: slots,
      overclockLevel: totalOverclock,
      isOverclocked: totalOverclock > 0
    };
  }

  /**
   * Install a cybermod on an actor
   */
  async installMod(actor, item, type, options = {}) {
    this.log(`Installing ${type} ${item.name} on ${actor.name}`);

    // Vérifier si déjà installé avec la même logique que les autres méthodes
    const isInstalled = item.system?.installed === true ||
                       item.flags?.['pound-of-flesh']?.installed === true;
    
    if (isInstalled) {
      ui.notifications.error(game.i18n.localize('POUNDOFFLESH.Notifications.AlreadyInstalled'));
      return false;
    }

    // Validate installation
    const validation = this.validateInstallation(actor, item, type);
    if (!validation.valid) {
      ui.notifications.error(validation.message);
      return false;
    }

    // Show stress selection dialog and prepare for native body check
    await this.showInstallationDialog(actor, item, type, options);
    
    return true; // Le processus continue avec le jet natif
  }

  /**
   * Show installation dialog with stress selection and body check initiation
   */
  async showInstallationDialog(actor, item, type, options) {
    const mods = this.getInstalledMods(actor);
    const willOverclock = this.willCauseOverclock(mods, type);

    let content = `
      <div class="cybermod-install">
        <h3>Installation de ${item.name}</h3>
        <p><strong>Description:</strong> ${item.system.description || 'Aucune description'}</p>
        <p><strong>Type:</strong> ${type === 'cyberware' ? 'Cyberware' : 'Slickware'}</p>
        <p><strong>Jet requis:</strong> Corps</p>
        <hr>
        <p><strong>Emplacements:</strong></p>
        <p>Cyberware: ${mods.cyberware.length}/${mods.slots.cyberware}</p>
        <p>Slickware: ${mods.slickware.length}/${mods.slots.slickware}</p>
    `;

    if (willOverclock) {
      content += `
        <hr>
        <p style="color: red;"><strong>⚠️ Attention: Surcadençage!</strong></p>
        <p>Niveau de surcadençage: ${mods.overclockLevel + 1}</p>
      `;
    }

    content += `
        <hr>
        <div class="stress-selection">
          <label for="stressChoice">Ajouter du stress pour bonus (+10 par point de stress) :</label>
          <select id="stressChoice">
            <option value="0">0 stress</option>
            <option value="1">1 stress (+10)</option>
            <option value="2">2 stress (+20)</option>
            <option value="3">3 stress (+30)</option>
          </select>
        </div>
      </div>
    `;

    return new Promise((resolve) => {
      // Utiliser l'API V2 de DialogV2 pour éviter les warnings de dépréciation
      const dialogData = {
        window: {
          title: "Installation de Cybermod"
        },
        position: {
          width: 500,
          height: 400
        },
        content: content,
        buttons: [
          {
            action: "install",
            label: "Faire le jet de Corps",
            icon: '<i class="fas fa-wrench"></i>',
            callback: async (event, button, dialog) => {
              // Dans l'API DialogV2, les données du formulaire sont dans event.target ou button.form
              let stressChoice = 0;
              
              try {
                // Essayer différentes méthodes d'accès aux données du formulaire
                let form = null;
                if (dialog?.element?.[0]) {
                  form = dialog.element[0].querySelector('form') || dialog.element[0];
                } else if (event?.target?.closest?.('form')) {
                  form = event.target.closest('form');
                } else if (dialog?.form) {
                  form = dialog.form;
                }
                
                if (form) {
                  const stressElement = form.querySelector('#stressChoice');
                  if (stressElement) {
                    stressChoice = parseInt(stressElement.value) || 0;
                  }
                }
              } catch (err) {
                console.warn('Pound of Flesh | Could not access form data:', err);
                stressChoice = 0;
              }
              
              // Ajouter le stress si choisi
              if (stressChoice > 0) {
                const currentStress = actor.system.other?.stress?.value || 2;
                await actor.update({"system.other.stress.value": currentStress + stressChoice});
                ui.notifications.info(`${stressChoice} point(s) de stress ajouté(s)`);
              }
              
              // Stocker les données d'installation pour après le jet
              await actor.setFlag('pound-of-flesh', 'pendingInstallation', {
                  cybermodId: item.id,  // Stocker seulement l'ID
                  cybermod: item,       // Garder aussi l'objet pour compatibilité immédiate
                  stressBonus: stressChoice * 10,
                  type: type
              });              
              
              // Lancer le workflow complet d'installation avec les dialogues natifs
              await this.startInstallationWorkflow(actor, item, type, stressChoice);
              resolve(true);
            }
          },
          {
            action: "cancel",
            label: "Annuler",
            icon: '<i class="fas fa-times"></i>',
            callback: () => resolve(false)
          }
        ],
        default: "install"
      };

      new foundry.applications.api.DialogV2(dialogData).render(true);
    });
  }

  /**
   * Remove a cybermod from an actor
   */
  async removeMod(actor, item, type) {
    this.log(`Removing ${type} ${item.name} from ${actor.name}`);

    // Confirm removal
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize('POUNDOFFLESH.RemoveCyberware') },
      content: game.i18n.format('POUNDOFFLESH.Dialogs.ConfirmRemoval', {
        item: item.name
      })
    });

    if (!confirmed) return false;

    // Remove cybermod flag
    const updateData = {};
    updateData[`system.${type}`] = false;
    updateData[`system.installed`] = false; // Flag uniforme pour l'interface
    updateData[`flags.pound-of-flesh.installed`] = false;
    updateData[`flags.pound-of-flesh.removedDate`] = new Date().toISOString();
    
    await item.update(updateData);

    // Show notification
    ui.notifications.info(game.i18n.format('POUNDOFFLESH.Notifications.ModRemoved', {
      item: item.name
    }));

    this.log(`Removal complete`);
    return true;
  }

  /**
   * Validate if an installation can proceed
   */
  validateInstallation(actor, item, type) {
    // Check if item is a cybermod
    if (this.getCyberType(item) === null) {
      return {
        valid: false,
        message: `${item.name} n'est pas un cybermod. Marquez-le comme cyber dans ses propriétés.`
      };
    }

    // Check if item is already installed (même logique que installMod)
    const isInstalled = item.system?.installed === true ||
                       item.flags?.['pound-of-flesh']?.installed === true;
                       
    if (isInstalled) {
      return {
        valid: false,
        message: game.i18n.localize('POUNDOFFLESH.Notifications.AlreadyInstalled')
      };
    }

    // Check for Slicksocket requirement
    if (type === 'slickware' && !this.hasSlicksocket(actor)) {
      return {
        valid: false,
        message: game.i18n.localize('POUNDOFFLESH.Notifications.SlicksocketRequired')
      };
    }

    // Check if the item type matches the installation type (if specified)
    const itemCyberType = this.getCyberType(item);
    if (itemCyberType && itemCyberType !== type) {
      return {
        valid: false,
        message: `${item.name} est configuré comme ${itemCyberType}, pas ${type}.`
      };
    }

    // NEW: Check prerequisites from cyberRequirements field
    const requirements = item.system?.cyberRequirements || "";
    if (requirements && requirements.trim() !== "") {
      const missingPrereqs = this.checkCyberPrerequisites(actor, requirements);
      if (missingPrereqs.length > 0) {
        return {
          valid: false,
          message: `Prérequis manquants pour ${item.name}: ${missingPrereqs.join(", ")}. Installez d'abord les cybermods requis.`
        };
      }
    }

    // Check available slots
    const mods = this.getInstalledMods(actor);
    const slotsRequired = this.getCyberSlotCost(item, type);
    const slotsAvailable = type === 'cyberware' ? 
      mods.slots.cyberware - mods.cyberware.length :
      mods.slots.slickware - mods.slickware.length;

    // Allow overclocking but warn
    if (slotsRequired > slotsAvailable && slotsAvailable >= 0) {
      const overclockLevel = slotsRequired - slotsAvailable;
      // Don't block, but this will be shown in the installation dialog
    }

    // Block only if no slots available at all for the type
    if (type === 'cyberware' && mods.slots.cyberware === 0) {
      return {
        valid: false,
        message: `Force insuffisante pour installer du cyberware. Force minimum: 10.`
      };
    }

    if (type === 'slickware' && mods.slots.slickware === 0 && this.hasSlicksocket(actor)) {
      return {
        valid: false,
        message: `Intellect insuffisant pour installer du slickware. Intellect minimum: 10.`
      };
    }

    return { valid: true };
  }

  /**
   * Check if installation will cause overclocking
   */
  willCauseOverclock(mods, type) {
    if (type === 'cyberware') {
      return mods.cyberware.length >= mods.slots.cyberware;
    } else {
      return mods.slickware.length >= mods.slots.slickware;
    }
  }

  /**
   * Perform installation roll
   */
  async performInstallationRoll(actor, item, type, options) {
    const rollType = type === 'cyberware' ? 'body' : 'sanity';
    const statValue = actor.system.stats?.[rollType]?.value || 0;
    
    // Create roll compatible with Mothership-Fr
    const roll = new Roll('1d100');
    await roll.evaluate();

    // Determine success/failure based on CORRECT Mothership-Fr mechanics
    const target = statValue;
    const total = roll.total;
    
    // Vraies règles Mothership 1e - logique des doubles
    const doubles = new Set([0, 11, 22, 33, 44, 55, 66, 77, 88, 99]);
    const isDoubleRoll = doubles.has(total);
    const is100 = total === 0 || total === 100; // 00 aux dés = 100
    const isSuccess = total < target || is100; // ÉGALITÉ = ÉCHEC !
    const isFailure = !isSuccess;
    
    // Critiques selon les vraies règles Mothership
    let isCritical = false;
    let isCriticalFailure = false;
    
    if (is100) {
        isCritical = true; // 100 = toujours succès critique
    } else if (isDoubleRoll && isSuccess) {
        isCritical = true; // Double réussi = succès critique
    } else if (isDoubleRoll && isFailure) {
        isCriticalFailure = true; // Double raté = échec critique
    }

    // Calculate effects
    const mods = this.getInstalledMods(actor);
    const slotsUsed = type === 'cyberware' ? mods.cyberware.length + 1 : mods.slickware.length + 1;

    return {
      roll: roll,
      target: target,
      success: isSuccess,
      critical: isCritical,
      criticalFailure: isCriticalFailure,
      failure: isFailure && !isCriticalFailure,
      slotsUsed: slotsUsed,
      type: type,
      rollType: rollType,
      
      // Nouvelles propriétés pour compatibilité
      isDouble: isDoubleRoll,
      is100: is100
    };
  }

  /**
   * Apply installation results to actor according to Pound of Flesh rules
   */
  async applyInstallationResults(actor, item, type, result) {
    const updates = {};

    if (result.critical) {
      // Succès critique : installation parfaite, réduction de stress
      const stressRoll = new Roll('1d5');
      await stressRoll.evaluate();
      const currentStress = actor.system.other?.stress?.value || 2;
      updates['system.other.stress.value'] = Math.max(actor.system.other?.stress?.min || 2, currentStress - stressRoll.total);
      result.stressReduction = stressRoll.total;
      
    } else if (result.fumble) {
      // Échec critique (fumble) : installation échoue, complications majeures
      if (type === 'cyberware') {
        // Cyberware fumble: dégâts + dysfonctionnement + test de panique
        const damageRoll = new Roll(`${result.slotsUsed}d10`);
        await damageRoll.evaluate();
        result.damage = damageRoll.total;
        result.needsMalfunction = true;
        result.needsPanic = true;
        
        // Appliquer les dégâts
        const currentHealth = actor.system.health?.value || 10;
        updates['system.health.value'] = Math.max(0, currentHealth - damageRoll.total);
        
        // Programmer les jets de tables
        setTimeout(() => {
          this.rollMalfunction(actor, item);
          this.rollCyberPanic(actor, item);
        }, 1000);
      } else {
        // Slickware fumble: perte de sanité + dysfonctionnement + stress + test de panique
        const currentSanity = actor.system.stats?.sanity?.value || 10;
        updates['system.stats.sanity.value'] = Math.max(0, currentSanity - result.slotsUsed);
        result.sanityLoss = result.slotsUsed;
        
        const currentStress = actor.system.other?.stress?.value || 2;
        updates['system.other.stress.value'] = currentStress + result.slotsUsed;
        result.stressGain = result.slotsUsed;
        
        result.needsMalfunction = true;
        result.needsPanic = true;
        
        setTimeout(() => {
          this.rollMalfunction(actor, item);
          this.rollCyberPanic(actor, item);
        }, 1000);
      }
      
    } else if (result.hasSideEffects) {
      // Échec normal : installation réussit MAIS avec effets secondaires
      if (type === 'cyberware') {
        // Cyberware échec : dégâts mineurs
        const damageRoll = new Roll(`${Math.ceil(result.slotsUsed / 2)}d10`);
        await damageRoll.evaluate();
        result.damage = damageRoll.total;
        
        // Appliquer les dégâts
        const currentHealth = actor.system.health?.value || 10;
        updates['system.health.value'] = Math.max(0, currentHealth - damageRoll.total);
      } else {
        // Slickware échec : gain de stress
        const currentStress = actor.system.other?.stress?.value || 2;
        updates['system.other.stress.value'] = currentStress + result.slotsUsed;
        result.stressGain = result.slotsUsed;
      }
    }

    // Appliquer les bonus de stress choisis par le joueur (si applicable)
    if (result.stressBonus > 0) {
      const currentStress = actor.system.other?.stress?.value || 2;
      updates['system.other.stress.value'] = Math.max(
        updates['system.other.stress.value'] || currentStress,
        (updates['system.other.stress.value'] || currentStress) + Math.floor(result.stressBonus / 10)
      );
    }

    // Appliquer les mises à jour si nécessaire
    if (Object.keys(updates).length > 0) {
      await actor.update(updates);
    }

    // Vérifier les effets de surcadençage
    const mods = this.getInstalledMods(actor);
    if (mods.isOverclocked) {
      setTimeout(() => this.showOverclockEffects(actor, mods.overclockLevel), 1500);
    }
  }

  /**
   * Create installation chat message in Mothership-Fr style
   */
  async createInstallationChatMessage(actor, item, type, result) {
    console.log('Pound of Flesh | Creating installation chat message...', { actor: actor.name, item: item.name, type, result });
    
    // Préparer les données de jet si disponibles
    let rollResult = null;
    let outcomeVerb = '';
    let comparisonText = '';
    
    if (result.roll) {
      // Extraire les valeurs du jet directement de result
      const rollTotal = result.total || result.roll.total;
      const rollTarget = result.target || 'N/A';
      const rollFormula = result.roll.formula || '1d100';
      
      // Déterminer le texte de résultat au lieu du nombre répétitif
      let resultText = '';
      if (result.critical) {
        resultText = 'Succès Critique';
      } else if (result.fumble) {
        resultText = 'Échec Critique';
      } else if (result.success) {
        resultText = 'Réussite';
      } else {
        resultText = 'Échec';
      }
      
      // Générer le HTML du jet au format Mothership-Fr
      const outcomeHtml = `
        <div class="grid grid-2col" style="margin-bottom: 10px; grid-template-columns: 1fr 1fr; text-align: center; font-size: 0.9rem; line-height: 20px;">
          <div class="dice-result">${rollTotal}</div>
          <div class="dice-target">&leq; ${rollTarget}</div>
        </div>
      `;
      
      const rollHtml = `
        
        <div class="roll-grid">
          <div class="roll-result ${result.success ? 'success' : 'failure'}">${resultText}</div>
        </div>
      `;
      
      rollResult = {
        
        rollHtml: rollHtml,
        success: result.success,
        critical: result.critical,
        criticalFailure: result.fumble,
        isBodyCheck: type === 'cyberware', // Slickware utilise Sanité, Cyberware utilise Corps
        isSlickwareCheck: type === 'slickware'
      };
      
      outcomeVerb = result.success ? 'réussissez' : 'échouez';
      comparisonText = result.success ? 'contre' : 'face à';
    }
    
    // Préparer le header du message
    const msgHeader = `Installation ${type === 'cyberware' ? 'Cyberware' : 'Slickware'} `;
    
    // Préparer l'image appropriée
    let msgImgPath = item.img || 'modules/pound-of-flesh/images/pound-of-flesh.png';
    
    // Préparer le texte de saveur selon le résultat (nouvelles règles Pound of Flesh)
    let flavorText = ` - ${item.name}`;
    if (result.critical) {
      flavorText = "L'installation se déroule parfaitement. Votre corps accepte l'augmentation avec une facilité surprenante.";
    } else if (result.fumble) {
      flavorText = "L'installation tourne au cauchemar. Votre corps rejette violemment l'augmentation cybernétique.";
    } else if (result.installationSuccess && result.hasSideEffects) {
      flavorText = "L'installation réussit mais votre corps résiste. La technologie s'intègre difficilement.";
    } else if (result.installationSuccess) {
      flavorText = "L'intervention chirurgicale réussit. Votre corps s'adapte progressivement à la nouvelle technologie.";
    } else {
      flavorText = "L'installation échoue complètement. Le cybermod ne peut pas être intégré.";
    }
    
    // Préparer les détails du résultat
    let resultDetails = [];
    resultDetails.push({
      label: "Type",
      value: type === 'cyberware' ? 'Cyberware' : 'Slickware'
    });
    resultDetails.push({
      label: "Statut Installation", 
      value: result.installationSuccess ? 'Réussie' : 'Échec'
    });
    resultDetails.push({
      label: "Emplacements utilisés",
      value: `${result.slotsUsed}/${type === 'cyberware' ? Math.floor(actor.system.stats.strength.value / 10) : Math.floor(actor.system.stats.intellect.value / 10)}`
    });
    
    if (result.stressBonus > 0) {
      resultDetails.push({
        label: "Bonus de stress appliqué",
        value: `+${result.stressBonus}`
      });
    }
    
    // Effets selon le résultat (nouvelles règles)
    if (result.critical && result.stressReduction) {
      resultDetails.push({
        label: "Stress réduit",
        value: `-${result.stressReduction}`
      });
    }
    
    if (result.fumble) {
      if (result.sanityLoss) {
        resultDetails.push({
          label: "Sanité perdue", 
          value: `-${result.sanityLoss}`
        });
      }
      if (result.damage) {
        resultDetails.push({
          label: "Dégâts subis",
          value: result.damage
        });
      }
      if (result.stressGain) {
        resultDetails.push({
          label: "Stress gagné",
          value: `+${result.stressGain}`
        });
      }
    } else if (result.hasSideEffects) {
      if (result.damage) {
        resultDetails.push({
          label: "Dégâts (effets secondaires)",
          value: result.damage
        });
      }
      if (result.stressGain) {
        resultDetails.push({
          label: "Stress gagné",
          value: `+${result.stressGain}`
        });
      }
    }
    
    // Actions supplémentaires nécessaires (nouvelles règles)
    let additionalActions = [];
    if (result.needsPanic) {
      additionalActions.push('Test de panique requis (table spéciale cybermod)');
    }
    if (result.needsMalfunction) {
      additionalActions.push('Dysfonctionnement de cybermod détecté (voir table)');
    }
    
    // Information spéciale pour les skillwares
    if (this.isSkillware(item)) {
      const selectedSkill = item.flags?.['pound-of-flesh']?.selectedSkill;
      const skillRank = item.flags?.['pound-of-flesh']?.skillRank;
      
      if (selectedSkill) {
        resultDetails.push({
          label: "Compétence Skillware",
          value: `${selectedSkill} (Rang ${skillRank})`
        });
        additionalActions.push(`Compétence ${selectedSkill} activée automatiquement`);
      } else if (result.success) {
        additionalActions.push('Sélection de compétence Skillware en cours...');
      }
    }
    
    // Préparer les données pour le template Mothership-Fr
    const templateData = {
      actor: actor,
      item: item,
      msgHeader: msgHeader,
      msgImgPath: msgImgPath,
      rollResult: rollResult,
      outcomeVerb: outcomeVerb,
      comparisonText: comparisonText,
      skillName: result.skillUsed || '',
      skillBonus: result.skillBonus || 0,
      flavorText: flavorText,
      resultDetails: resultDetails,
      additionalActions: additionalActions,
      needsDesc: false  // Pas de description d'item pour l'installation
    };

    // Utiliser le template Mothership-Fr standard
    const template = 'modules/pound-of-flesh/templates/pound-of-flesh-chat.hbs';
    const renderedContent = await renderTemplate(template, templateData);
    
    // Créer le message de chat avec le style Mothership-Fr
    const messageData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      content: renderedContent,
      style: CONST.CHAT_MESSAGE_STYLES.OTHER
    };

    console.log('Pound of Flesh | Creating chat message with Mothership-Fr template');
    
    await ChatMessage.create(messageData);
    console.log('Pound of Flesh | Installation chat message created successfully');
  }

  /**
   * Handle actor updates (recalculate slots when stats change)
   */
  onActorUpdate(actor, data) {
    if (data.system?.stats) {
      this.log(`Actor ${actor.name} stats updated, recalculating slots`);
      // Slots will be recalculated automatically on next sheet render
    }
  }

  /**
   * Handle item updates (cyberware flag changes)
   */
  onItemUpdate(item, data) {
    // Nouveau système cyber
    if (data.system?.cyber !== undefined) {
      this.log(`Item ${item.name} cyber flag changed to ${data.system.cyber}`);
    }
    if (data.system?.cyberType !== undefined) {
      this.log(`Item ${item.name} cyber type changed to ${data.system.cyberType}`);
    }
    
    // Système legacy (pour compatibilité)
    if (data.system?.cyberware !== undefined) {
      this.log(`Item ${item.name} cyberware flag changed to ${data.system.cyberware}`);
    }
    if (data.system?.slickware !== undefined) {
      this.log(`Item ${item.name} slickware flag changed to ${data.system.slickware}`);
    }
  }

  /**
   * Handle pre-create item (auto-calculate custom cybermod costs)
   */
  onPreCreateItem(item, data) {
    // Nouveau système cyber
    if (data.system?.cyber || this.getCyberType(data) !== null) {
      this.log(`Pre-creating cybermod item ${data.name} (type: ${data.system?.cyberType || 'unknown'})`);
      // Could implement custom cost calculation here
    }
    // Système legacy
    else if (data.system?.cyberware || data.system?.slickware) {
      this.log(`Pre-creating legacy cybermod item ${data.name}`);
      // Could implement custom cost calculation here
    }
  }

  /**
   * Attempt cyberware installation (called from UI)
   */
  async attemptInstallation(actor, item, cyberType) {
    this.log(`Attempting installation of ${cyberType} ${item.name} on ${actor.name}`);
    
    try {
      const result = await this.installMod(actor, item, cyberType);
      if (result) {
        ui.notifications.info(game.i18n.format('POUNDOFFLESH.Notifications.InstallationComplete'));
      }
      return result;
    } catch (error) {
      console.error('Pound of Flesh | Installation failed:', error);
      ui.notifications.error('Erreur lors de l\'installation du cybermod');
      return false;
    }
  }

  /**
   * Roll on cybermod malfunction table
   */
  async rollMalfunction(actor, item = null) {
    this.log(`Rolling malfunction for ${actor.name}`);

    try {
      // Recherche de la table avec plusieurs stratégies
      let table = null;
      
      // Stratégie 1: Chercher dans les tables du monde
      table = game.tables.find(t => 
        t.name === "Table de Dysfonctionnements Cybermod" || 
        t.id === "cybermod_malfunction_table" ||
        t.flags?.["pound-of-flesh"]
      );
      
      // Stratégie 2: Chercher dans le compendium
      if (!table) {
        const pack = game.packs.get('pound-of-flesh.pound-of-flesh-tables');
        if (pack) {
          await pack.getIndex();
          
          // Essayer plusieurs méthodes de recherche
          let tableDocument = pack.index.find(t => 
            t._id === 'cybermod_malfunction_table' ||
            t.name === "Table de Dysfonctionnements Cybermod" ||
            t._id === '1n40jEqAZXekrhfB' // L'UUID que vous avez fourni
          );
          
          if (tableDocument) {
            table = await pack.getDocument(tableDocument._id);
          }
        }
      }
      
      // Stratégie 3: Utilisation directe de l'UUID si disponible
      if (!table) {
        try {
          table = await fromUuid("Compendium.pound-of-flesh.pound-of-flesh-tables.RollTable.1n40jEqAZXekrhfB");
        } catch (e) {
          this.log("UUID lookup failed, continuing with other methods");
        }
      }
      
      if (!table) {
        ui.notifications.error("Table de dysfonctionnements non trouvée. Assurez-vous que les tables Pound of Flesh sont installées.");
        console.error("Pound of Flesh | Aucune table de dysfonctionnement trouvée");
        return null;
      }

      this.log(`Found malfunction table: ${table.name} (ID: ${table.id})`);
      
      const result = await table.roll();
      
      // Create chat message in Mothership-Fr style
      const content = await this.createMalfunctionChatMessage(actor, result, item);
      
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        content: content,
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        sound: CONFIG.sounds.dice
      });

      return result;
    } catch (error) {
      console.error('Pound of Flesh | Malfunction roll failed:', error);
      ui.notifications.error('Erreur lors du jet de dysfonctionnement: ' + error.message);
      return null;
    }
  }

  /**
   * Roll on cybermod panic table  
   */
  async rollCyberPanic(actor, item = null) {
    this.log(`Rolling cyber panic for ${actor.name}`);

    try {
      // Recherche de la table avec plusieurs stratégies
      let table = null;
      
      // Stratégie 1: Chercher dans les tables du monde
      table = game.tables.find(t => 
        t.name === "Table de Panique Cybermod" || 
        t.id === "cybermod_panic_table" ||
        t.flags?.["pound-of-flesh"]
      );
      
      // Stratégie 2: Chercher dans le compendium
      if (!table) {
        const pack = game.packs.get('pound-of-flesh.pound-of-flesh-tables');
        if (pack) {
          await pack.getIndex();
          
          let tableDocument = pack.index.find(t => 
            t._id === 'cybermod_panic_table' ||
            t.name === "Table de Panique Cybermod"
          );
          
          if (tableDocument) {
            table = await pack.getDocument(tableDocument._id);
          }
        }
      }
      
      if (!table) {
        ui.notifications.error("Table de panique cybermod non trouvée. Assurez-vous que les tables Pound of Flesh sont installées.");
        console.error("Pound of Flesh | Aucune table de panique trouvée");
        return null;
      }

      this.log(`Found panic table: ${table.name} (ID: ${table.id})`);
      
      const result = await table.roll();
      
      // Create chat message in Mothership-Fr style
      const content = await this.createPanicChatMessage(actor, result, item);
      
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        content: content,
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        sound: CONFIG.sounds.dice
      });

      return result;
    } catch (error) {
      console.error('Pound of Flesh | Panic roll failed:', error);
      ui.notifications.error('Erreur lors du jet de panique: ' + error.message);
      return null;
    }
  }

  /**
   * Create malfunction chat message in Mothership-Fr style
   */
  async createMalfunctionChatMessage(actor, result, item) {
    const rollResult = result.results[0];
    
    // Préparer les données de jet au format Mothership-Fr
    const outcomeHtml = `
      <div class="grid grid-2col" style="margin-bottom: 10px; grid-template-columns: 1fr 1fr; text-align: center; font-size: 0.9rem; line-height: 20px;">
        <div class="dice-result">${result.roll.total}</div>
        <div class="dice-target">Table Dysfonctionnement</div>
      </div>
    `;
    
    const rollHtml = `
      <div class="rollh2" style="text-transform: lowercase;">d100</div>
      <div class="roll-grid">
        <div class="roll-result">${result.roll.total}</div>
      </div>
    `;
    
    // Préparer le header du message
    const msgHeader = `Dysfonctionnement Cybermod${item ? ` - ${item.name}` : ''}`;
    
    // Préparer l'image appropriée
    let msgImgPath = item?.img || 'modules/pound-of-flesh/images/malfunction-icon.png';
    
    // Préparer le texte de saveur
    const flavorText = "Le cybermod montre des signes de dysfonctionnement inquiétants...";
    
    // Préparer les détails du résultat
    let resultDetails = [{
      label: "Effet",
      value: rollResult.text
    }];
    
    if (item) {
      resultDetails.push({
        label: "Mod affecté",
        value: item.name
      });
    }
    
    // Préparer les données pour le template
    const templateData = {
      actor: actor,
      item: item,
      msgHeader: msgHeader,
      msgImgPath: msgImgPath,
      rollResult: {
        outcomeHtml: outcomeHtml,
        rollHtml: rollHtml,
        success: true, // Dysfonctionnement réussi à être déterminé
        critical: false,
        criticalFailure: false,
        isBodyCheck: false
      },
      flavorText: flavorText,
      resultDetails: resultDetails,
      needsDesc: false,
      effectDescription: rollResult.text
    };

    // Rendre le template
    const messageTemplate = 'modules/pound-of-flesh/templates/pound-of-flesh-chat.hbs';
    const messageContent = await foundry.applications.handlebars.renderTemplate(messageTemplate, templateData);

    // Créer le message de chat
    await ChatMessage.create({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      content: messageContent,
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      sound: CONFIG.sounds.dice
    });

    return messageContent;
  }

  /**
   * Create panic chat message in Mothership-Fr style
   */
  async createPanicChatMessage(actor, result, item) {
    const rollResult = result.results[0];
    
    // Préparer les données de jet au format Mothership-Fr
    const outcomeHtml = `
      <div class="grid grid-2col" style="margin-bottom: 10px; grid-template-columns: 1fr 1fr; text-align: center; font-size: 0.9rem; line-height: 20px;">
        <div class="dice-result">${result.roll.total}</div>
        <div class="dice-target">Table Panique Cybermod</div>
      </div>
    `;
    
    const rollHtml = `
      <div class="rollh2" style="text-transform: lowercase;">d20</div>
      <div class="roll-grid">
        <div class="roll-result">${result.roll.total}</div>
      </div>
    `;
    
    // Préparer le header du message
    const msgHeader = `Test de Panique Cybermod${item ? ` - ${item.name}` : ''}`;
    
    // Préparer l'image appropriée
    let msgImgPath = item?.img || 'modules/pound-of-flesh/images/panic-icon.png';
    
    // Préparer le texte de saveur
    const flavorText = "L'interaction entre l'esprit et la machine provoque une réaction inattendue...";
    
    // Préparer les détails du résultat
    let resultDetails = [{
      label: "Résultat",
      value: rollResult.text
    }];
    
    if (item) {
      resultDetails.push({
        label: "Mod déclencheur",
        value: item.name
      });
    }
    
    // Préparer les données pour le template
    const templateData = {
      actor: actor,
      item: item,
      msgHeader: msgHeader,
      msgImgPath: msgImgPath,
      rollResult: {
        outcomeHtml: outcomeHtml,
        rollHtml: rollHtml,
        success: true, // Panique réussie à être déterminée
        critical: false,
        criticalFailure: false,
        isBodyCheck: false
      },
      flavorText: flavorText,
      resultDetails: resultDetails,
      needsDesc: false,
      effectDescription: rollResult.text
    };

    // Rendre le template
    const messageTemplate = 'modules/pound-of-flesh/templates/pound-of-flesh-chat.hbs';
    const messageContent = await foundry.applications.handlebars.renderTemplate(messageTemplate, templateData);

    // Créer le message de chat
    await ChatMessage.create({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      content: messageContent,
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      sound: CONFIG.sounds.dice
    });

    return messageContent;
  }

  /**
   * Show overclock level effects in Mothership-Fr style
   */
  async showOverclockEffects(actor, level) {
    const effectText = game.i18n.localize(`POUNDOFFLESH.OverclockLevels.${level}`);
    
    // Préparer le header du message
    const msgHeader = `Surcadençage Niveau ${level}`;
    
    // Préparer l'image appropriée
    let msgImgPath = 'modules/pound-of-flesh/images/overclock-icon.png';
    
    // Préparer le texte de saveur
    const flavorText = "Le surcadençage pousse les cybermods au-delà de leurs limites...";
    
    // Préparer les détails du résultat
    let resultDetails = [{
      label: "Niveau de surcadençage",
      value: level
    }, {
      label: "Effet",
      value: effectText
    }];
    
    // Préparer les données pour le template
    const templateData = {
      actor: actor,
      msgHeader: msgHeader,
      msgImgPath: msgImgPath,
      flavorText: flavorText,
      resultDetails: resultDetails,
      needsDesc: false
    };

    // Rendre le template
    const messageTemplate = 'modules/pound-of-flesh/templates/pound-of-flesh-chat.hbs';
    const messageContent = await foundry.applications.handlebars.renderTemplate(messageTemplate, templateData);

    // Créer le message de chat
    await ChatMessage.create({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      content: messageContent,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
  }

  /**
   * Make a body check using the native Mothership-Fr rollCheck system
   */
  async makeBodyCheck(actor) {
    try {
      this.log('Starting body check using exact same method as actor sheet');
      
      console.log('Pound of Flesh | Dice So Nice active?', game.modules.get("dice-so-nice")?.active);
      
      // Utiliser EXACTEMENT la même méthode que la feuille d'acteur
      // Le null en premier paramètre déclenche automatiquement le dialogue de choix
      const bodyRollResult = await actor.rollCheck(null, 'low', 'body', null, null, null);
      
      console.log('Pound of Flesh | Native body roll completed:', bodyRollResult);
      
      // Le système natif retourne les données du message créé
      if (bodyRollResult && bodyRollResult.length > 0) {
        const messageData = bodyRollResult[0];
        
        // Extraire les informations du résultat pour traitement
        const rollInfo = messageData.parsedRollResult;
        
        const result = {
          success: rollInfo.success,
          critical: rollInfo.critical,
          fumble: rollInfo.fumble,
          total: rollInfo.total,
          target: rollInfo.target,
          roll: rollInfo.roll
        };
        
        this.log(`Body check result: ${result.success ? 'Success' : 'Failure'} (${result.total}/${result.target})`);
        
        // Traiter le résultat d'installation
        const pendingData = actor.getFlag('pound-of-flesh', 'pendingInstallation');
        if (pendingData) {
          await this.processInstallationResult(actor, pendingData.cybermod, result, pendingData.stressBonus);
          await actor.unsetFlag('pound-of-flesh', 'pendingInstallation');
        }
      }
      
    } catch (error) {
      console.error('Pound of Flesh | Body check failed:', error);
      ui.notifications.error('Erreur lors du jet de corps');
      // Nettoyer le flag en cas d'erreur
      await actor.unsetFlag('pound-of-flesh', 'pendingInstallation');
    }
  }

  /**
   * Process installation result after native roll
   */
  async processInstallationResult(actor, cybermod, rollResult, stressBonus = 0) {
    // S'assurer que cybermod est un Document actif
    let cybermodDoc = cybermod;
    
    // Essayer d'abord de récupérer via les données pendingInstallation
    const pendingData = actor.getFlag('pound-of-flesh', 'pendingInstallation');
    if (pendingData?.cybermodId) {
      cybermodDoc = actor.items.get(pendingData.cybermodId);
    }
    
    // Si on n'a pas encore le bon document, essayer via l'objet passé
    if (!cybermodDoc?.update) {
      // Si cybermod n'est que des données, récupérer le vrai Document
      cybermodDoc = actor.items.get(cybermod._id || cybermod.id);
      if (!cybermodDoc) {
        this.log(`Error: Could not find cybermod item with ID ${cybermod._id || cybermod.id}`);
        return false;
      }
    }
    
    // Déterminer le type de cybermod avec le nouveau système
    let type = this.getCyberType(cybermodDoc);
    if (!type) {
      // Fallback: utiliser le type demandé dans pendingInstallation
      type = pendingData?.type || 'cyberware';
    }
    
    // Analyser le résultat du jet natif selon les VRAIES règles de Mothership
    // Règles d'installation de cyberware dans Pound of Flesh :
    // - Succès critique (double sous la cible) = Installation parfaite
    // - Succès normal (sous la cible) = Installation réussie
    // - Échec normal (au-dessus de la cible) = Installation réussie MAIS avec complications
    // - Échec critique (double au-dessus de la cible) = Installation échoue complètement
    
    const isSuccess = rollResult.success || false;
    const isCritical = rollResult.critical || false;
    const isFumble = rollResult.fumble || false;
    
    // Dans Pound of Flesh, l'installation RÉUSSIT même en cas d'échec normal
    // Seul l'échec critique (fumble) fait échouer l'installation
    const installationSuccess = !isFumble; // Installation réussit sauf fumble
    const hasSideEffects = !isSuccess; // Effets secondaires si échec (même si installation réussit)
    
    // Calculer les effets
    const mods = this.getInstalledMods(actor);
    const slotsUsed = type === 'cyberware' ? mods.cyberware.length + 1 : mods.slickware.length + 1;

    const result = {
      roll: rollResult.roll,
      target: rollResult.target,
      success: isSuccess,
      critical: isCritical,
      criticalFailure: isFumble,
      fumble: isFumble,
      failure: !isSuccess && !isFumble,
      slotsUsed: slotsUsed,
      type: type,
      rollType: 'body',
      stressBonus: stressBonus,
      rollString: rollResult.rollString, // Préserver le type de jet (normal/avantage/désavantage)
      
      // Nouvelles propriétés pour les règles Pound of Flesh
      installationSuccess: installationSuccess,
      hasSideEffects: hasSideEffects,
      total: rollResult.total
    };

    // Appliquer les conséquences selon les nouvelles règles
    await this.applyInstallationConsequences(actor, cybermodDoc, type, result);

    // Appliquer les résultats
    await this.applyInstallationResults(actor, cybermodDoc, type, result);

    // Marquer l'objet comme installé si installation réussie (selon les vraies règles Pound of Flesh)
    if (result.installationSuccess) {
      const updateData = {};
      
      console.log(`Pound of Flesh | Marking ${cybermodDoc.name} as installed (success: ${result.success}, fumble: ${result.fumble})`);
      
      // Nouveau système: marquer system.installed ET system.cyber
      updateData[`system.installed`] = true;
      updateData[`system.cyber`] = true;
      
      // Si pas de cyberType défini, le définir maintenant
      if (!cybermodDoc.system.cyberType) {
        updateData[`system.cyberType`] = type;
      }
      
      // Marquer aussi l'ancien système pour compatibilité
      updateData[`system.${type}`] = true;
      
      // Ajouter des flags pour le suivi
      updateData[`flags.pound-of-flesh.installed`] = true;
      updateData[`flags.pound-of-flesh.installDate`] = new Date().toISOString();
      updateData[`flags.pound-of-flesh.installedBy`] = game.user.id;
      updateData[`flags.pound-of-flesh.installationType`] = type;
      
      console.log('Pound of Flesh | Update data for installation:', updateData);
      
      await cybermodDoc.update(updateData);
      this.log(`Item ${cybermodDoc.name} marked as installed (${type})`);
      
      // Gestion spéciale des skillwares - sélection de compétence
      if (this.isSkillware(cybermodDoc)) {
        await this.handleSkillwareInstallation(actor, cybermodDoc);
      }
    } else {
      console.log(`Pound of Flesh | Item ${cybermodDoc.name} installation failed completely (fumble), not marking as installed`);
      this.log(`Item ${cybermodDoc.name} installation failed, not marking as installed`);
    }

    // Créer UN SEUL message de chat final pour l'installation
    await this.createInstallationChatMessage(actor, cybermodDoc, type, result);
    
    console.log('Pound of Flesh | Installation process completed for:', cybermodDoc.name);

    return result.installationSuccess; // Retourner le succès d'installation, pas le succès du jet
  }

  /**
   * Appliquer les conséquences d'installation selon les règles officielles
   */
  async applyInstallationConsequences(actor, cybermodDoc, type, result) {
    if (!result.consequences) return;

    const consequences = result.consequences;

    // Appliquer les dégâts si spécifiés
    if (consequences.damage && consequences.damage > 0) {
      const currentHealth = actor.system.health?.value ?? 0;
      const newHealth = Math.max(0, currentHealth - consequences.damage);
      
      await actor.update({"system.health.value": newHealth});
      
      console.log(`Installation damage applied: ${consequences.damage} points, new health: ${newHealth}`);
    }

    // Appliquer le dysfonctionnement si nécessaire
    if (consequences.malfunction) {
      // Marquer le cyberware comme défaillant
      await cybermodDoc.update({"system.malfunction": true});
      console.log(`Cyberware ${cybermodDoc.name} marked as malfunctioning`);
    }

    // Appliquer la mutation si nécessaire
    if (consequences.mutation) {
      // Pour l'instant, juste un log - pourrait être étendu
      console.log(`Mutation consequence triggered for ${actor.name}`);
    }

    // Appliquer le stress si spécifié
    if (consequences.stress && consequences.stress > 0) {
      const currentStress = actor.system.stress?.value ?? 0;
      const newStress = Math.min(actor.system.stress?.max ?? 100, currentStress + consequences.stress);
      
      await actor.update({"system.stress.value": newStress});
      
      console.log(`Installation stress applied: ${consequences.stress} points, new stress: ${newStress}`);
    }
  }

  /**
   * Perform a Sanity Save roll in Mothership-Fr style
   */
  async performSanitySave(actor, options = {}) {
    const sanityValue = actor.system.stats?.sanity?.value || 0;
    const roll = new Roll('1d100');
    await roll.evaluate();

    const success = roll.total <= sanityValue;
    const critical = roll.total <= Math.floor(sanityValue / 10);
    const criticalFailure = roll.total >= 96;

    // Préparer les données de jet au format Mothership-Fr
    const outcomeHtml = `
      <div class="grid grid-2col" style="margin-bottom: 10px; grid-template-columns: 1fr 1fr; text-align: center; font-size: 0.9rem; line-height: 20px;">
        <div class="dice-result">${roll.total}</div>
        <div class="dice-target">&leq; ${sanityValue}</div>
      </div>
    `;
    
    const rollHtml = `
      <div class="rollh2" style="text-transform: lowercase;">d100</div>
      <div class="roll-grid">
        <div class="roll-result ${success ? 'success' : 'failure'}">${roll.total}</div>
      </div>
    `;
    
    // Préparer le header du message
    const msgHeader = "Jet de Sanité";
    
    // Préparer l'image appropriée
    let msgImgPath = 'modules/pound-of-flesh/images/sanity-icon.png';
    
    // Préparer le texte de saveur
    let flavorText = '';
    if (critical) {
      flavorText = "Votre esprit reste parfaitement stable face à l'horreur.";
    } else if (success) {
      flavorText = "Vous parvenez à garder votre sang-froid malgré la situation.";
    } else if (criticalFailure) {
      flavorText = "Votre sanité s'effrite face à l'indicible terreur.";
    } else {
      flavorText = "Votre esprit vacille sous le poids de ce que vous venez de vivre.";
    }
    
    // Préparer les détails du résultat
    let resultDetails = [{
      label: "Cible",
      value: sanityValue
    }, {
      label: "Résultat",
      value: critical ? 'Succès Critique' : success ? 'Succès' : criticalFailure ? 'Échec Critique' : 'Échec'
    }];
    
    // Préparer les données pour le template
    const templateData = {
      actor: actor,
      msgHeader: msgHeader,
      msgImgPath: msgImgPath,
      rollResult: {
        outcomeHtml: outcomeHtml,
        rollHtml: rollHtml,
        success: success,
        critical: critical,
        criticalFailure: criticalFailure,
        isBodyCheck: false
      },
      flavorText: flavorText,
      resultDetails: resultDetails,
      needsDesc: false
    };

    // Rendre le template
    const messageTemplate = 'modules/pound-of-flesh/templates/pound-of-flesh-chat.hbs';
    const messageContent = await foundry.applications.handlebars.renderTemplate(messageTemplate, templateData);

    // Créer le message de chat
    await ChatMessage.create({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      content: messageContent,
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      sound: CONFIG.sounds.dice
    });

    return {
      roll: roll,
      success: success,
      critical: critical,
      criticalFailure: criticalFailure,
      target: sanityValue
    };
  }

  /**
   * Overclock a cyberware item in Mothership-Fr style
   */
  async overclockCyberware(actor, item) {
    this.log(`Overclocking ${item.name} for ${actor.name}`);
    
    // Check if item can be overclocked
    if (!item.system.canOverclock) {
      ui.notifications.warn(game.i18n.localize('POUNDOFFLESH.CannotOverclock'));
      return false;
    }

    // Show confirmation dialog
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize('POUNDOFFLESH.Overclocked') },
      content: `
        <p>Voulez-vous surcadencer <strong>${item.name}</strong>?</p>
        <p><em>Cela augmentera les effets mais peut causer des dysfonctionnements.</em></p>
      `
    });

    if (!confirmed) return false;

    // Apply overclock effects
    await item.update({ 'system.overclocked': true });
    
    // Préparer le header du message
    const msgHeader = `Surcadençage - ${item.name}`;
    
    // Préparer l'image appropriée
    let msgImgPath = item.img || 'modules/pound-of-flesh/images/overclock-icon.png';
    
    // Préparer le texte de saveur
    const flavorText = "Les effets sont améliorés mais des dysfonctionnements peuvent survenir.";
    
    // Préparer les détails du résultat
    let resultDetails = [{
      label: "Statut",
      value: "Surcadencé avec succès"
    }, {
      label: "Personnage",
      value: actor.name
    }];
    
    // Préparer les données pour le template
    const templateData = {
      actor: actor,
      item: item,
      msgHeader: msgHeader,
      msgImgPath: msgImgPath,
      flavorText: flavorText,
      resultDetails: resultDetails,
      needsDesc: true
      // CORRECTION: Supprimer effectDescription pour éviter la duplication avec item.system.description
    };

    // Rendre le template
    const messageTemplate = 'modules/pound-of-flesh/templates/pound-of-flesh-chat.hbs';
    const messageContent = await foundry.applications.handlebars.renderTemplate(messageTemplate, templateData);

    // Créer le message de chat
    await ChatMessage.create({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      content: messageContent,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });

    ui.notifications.info(`${item.name} surcadencé avec succès`);
    return true;
  }

  /**
   * Start complete installation workflow with native dialogs
   */
  async startInstallationWorkflow(actor, cybermod, type, stressBonus) {
    try {
      this.log('Starting complete installation workflow with native dialogs');
      
      // Étape 1: Dialogue de choix de compétence (si pas de compétence préférée)
      let selectedSkill = null;
      const bodySkills = ['athletics', 'combat', 'first_aid']; // Compétences liées au corps
      
      if (bodySkills.length > 0) {
        selectedSkill = await this.showSkillSelectionDialog(actor, bodySkills);
        if (selectedSkill === null) {
          console.log('Installation cancelled - no skill selected');
          return false;
        }
      }
      
      // Étape 2: Dialogue d'avantage/désavantage (natif de Mothership-Fr)
      const rollParams = await this.showAdvantageDialog(actor, selectedSkill, type);
      if (!rollParams) {
        console.log('Installation cancelled - no roll parameters');
        return false;
      }
      
      // Étape 3: Faire le jet de corps avec les paramètres choisis
      const rollResult = await this.performBodyRollWithParameters(actor, rollParams, stressBonus);
      
      // Étape 4: Traiter les résultats
      if (rollResult) {
        const pendingData = actor.getFlag('pound-of-flesh', 'pendingInstallation');
        if (pendingData) {
          await this.processInstallationResult(actor, pendingData.cybermod, rollResult, pendingData.stressBonus);
          await actor.unsetFlag('pound-of-flesh', 'pendingInstallation');
        }
      }
      
      return rollResult;
      
    } catch (error) {
      console.error('Pound of Flesh | Installation workflow failed:', error);
      ui.notifications.error('Erreur lors de l\'installation du cybermod');
      await actor.unsetFlag('pound-of-flesh', 'pendingInstallation');
      return false;
    }
  }

  /**
   * Show skill selection dialog for installation
   */
  async showSkillSelectionDialog(actor, availableSkills) {
    return new Promise((resolve) => {
      const skillOptions = availableSkills.map(skill => {
        const skillData = actor.items.find(i => i.type === 'skill' && i.name.toLowerCase().includes(skill));
        return `<option value="${skill}">${skillData ? skillData.name : skill}</option>`;
      }).join('');
      
      const content = `
        <form>
          <div class="form-group">
            <label for="skillChoice">Choisir une compétence pour l'installation:</label>
            <select id="skillChoice" name="skillChoice" style="width: 100%;">
              <option value="">Utiliser Corps seulement</option>
              ${skillOptions}
            </select>
          </div>
        </form>
      `;
      
      foundry.applications.api.DialogV2.prompt({
        window: { 
          title: "Sélection de Compétence - Installation Cybermod",
          resizable: false 
        },
        content: content,
        ok: {
          callback: (event, button, dialog) => {
            let selectedSkill = '';
            try {
              const form = dialog.element[0].querySelector('form');
              if (form) {
                selectedSkill = form.querySelector('#skillChoice')?.value || '';
              }
            } catch (err) {
              console.warn('Could not get skill selection:', err);
            }
            resolve(selectedSkill);
          }
        },
        cancel: {
          callback: () => resolve(null)
        }
      });
    });
  }

  /**
   * Show advantage/disadvantage dialog (using native Mothership-Fr style)
   */
  async showAdvantageDialog(actor, selectedSkill, type) {
    return new Promise((resolve) => {
      const statType = type === 'cyberware' ? 'body' : 'sanity';
      const statLabel = type === 'cyberware' ? 'Corps' : 'Sanité';
      
      const content = `
        <form>
          <div class="form-group">
            <label>Type de jet ${statLabel} pour l'installation:</label>
            <div style="margin: 10px 0;">
              <input type="radio" id="normal" name="rollType" value="normal" checked>
              <label for="normal">Normal</label>
            </div>
            <div style="margin: 10px 0;">
              <input type="radio" id="advantage" name="rollType" value="advantage">
              <label for="advantage">Avantage (+)</label>
            </div>
            <div style="margin: 10px 0;">
              <input type="radio" id="disadvantage" name="rollType" value="disadvantage">
              <label for="disadvantage">Désavantage (-)</label>
            </div>
          </div>
        </form>
      `;
      
      foundry.applications.api.DialogV2.prompt({
        window: { 
          title: `Type de Jet ${statLabel} - Installation ${type === 'cyberware' ? 'Cyberware' : 'Slickware'}`,
          resizable: false 
        },
        content: content,
        ok: {
          callback: (event, button, dialog) => {
            let rollType = 'normal';
            try {
              const form = dialog.element[0].querySelector('form');
              if (form) {
                const checkedRadio = form.querySelector('input[name="rollType"]:checked');
                rollType = checkedRadio?.value || 'normal';
              }
            } catch (err) {
              console.warn('Could not get roll type:', err);
            }
            resolve({
              rollType: rollType,
              skill: selectedSkill,
              attribute: statType
            });
          }
        },
        cancel: {
          callback: () => resolve(null)
        }
      });
    });
  }

  /**
   * Perform body roll with specific parameters and show dice
   */
  async performBodyRollWithParameters(actor, params, stressBonus) {
    try {
      console.log('Pound of Flesh | Performing body roll with params:', params, 'stress bonus:', stressBonus);
      console.log('Pound of Flesh | Dice So Nice active?', game.modules.get("dice-so-nice")?.active);
      
      // Construire le string de jet selon le type
      let rollString = '1d100';
      let aimFor = 'low';
      
      switch (params.rollType) {
        case 'advantage':
          rollString = '1d100 [+]';
          break;
        case 'disadvantage':
          rollString = '1d100 [-]';
          break;
        default:
          rollString = '1d100';
      }
      
      console.log('Pound of Flesh | Roll string:', rollString);
      
      // Utiliser le système natif rollCheck mais avec nos paramètres CORRECTEMENT ORDONNÉS
      const bodyRollResult = await actor.rollCheck(rollString, aimFor, 'body', params.skill, null, null);
      
      console.log('Pound of Flesh | Body roll completed:', bodyRollResult);
      
      // Attendre que Dice So Nice termine ses animations si actif
      if (game.modules.get("dice-so-nice")?.active && bodyRollResult && bodyRollResult.length > 0) {
        console.log('Pound of Flesh | Waiting for Dice So Nice animations...');
        // Attendre un peu pour que DSN termine
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (bodyRollResult && bodyRollResult.length > 0) {
        const messageData = bodyRollResult[0];
        const rollInfo = messageData.parsedRollResult;
        
        return {
          success: rollInfo.success,
          critical: rollInfo.critical,
          fumble: rollInfo.fumble,
          total: rollInfo.total,
          target: rollInfo.target,
          roll: rollInfo.roll,
          rollType: params.rollType
        };
      }
      
      return null;
      
    } catch (error) {
      console.error('Pound of Flesh | Body roll with parameters failed:', error);
      return null;
    }
  }
}