/**
 * Pound of Flesh Module for Mothership-Fr
 * Adds cyberware and slickware functionality to the Mothership-Fr system
 */

// Module classes - will be loaded dynamically
let CyberwareManager, ActorSheetModifications, ItemSheetModifications, TemplateInjectionManager;

// Module initialization
Hooks.once('init', async () => {
  console.log('Pound of Flesh | Initializing module for Mothership-Fr');
  
  // Register module settings first
  game.settings.register('pound-of-flesh', 'enableCybermods', {
    name: game.i18n.localize('POUNDOFFLESH.ModuleTitle'),
    hint: game.i18n.localize('POUNDOFFLESH.ModuleDescription'),
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
    onChange: value => {
      console.log(`Pound of Flesh | Cybermods ${value ? 'enabled' : 'disabled'}`);
    }
  });

  game.settings.register('pound-of-flesh', 'debugMode', {
    name: 'Mode Debug',
    hint: 'Active les logs de débogage pour le module Pound of Flesh',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register('pound-of-flesh', 'installationDifficulty', {
    name: 'Modificateur de difficulté',
    hint: 'Modificateur appliqué à tous les tests d\'installation de cybermods (-20 à +20)',
    scope: 'world',
    config: true,
    type: Number,
    range: { min: -20, max: 20, step: 5 },
    default: 0
  });
  
  console.log('Pound of Flesh | Settings registered');
});

// Setup hook - Load modules after core is ready
Hooks.once('setup', async () => {
  console.log('Pound of Flesh | Setup phase - Loading modules');
  
  try {
    // Load modules dynamically
    const cyberwareModule = await import('./scripts/cyberware-manager.js');
    const actorSheetModule = await import('./scripts/actor-sheet-mods.js');
    const itemSheetModule = await import('./scripts/item-sheet-mods.js');
    const templateModule = await import('./scripts/template-injection-manager.js');
    
    CyberwareManager = cyberwareModule.CyberwareManager;
    ActorSheetModifications = actorSheetModule.ActorSheetModifications;
    ItemSheetModifications = itemSheetModule.ItemSheetModifications;
    TemplateInjectionManager = templateModule.TemplateInjectionManager;
    
    console.log('Pound of Flesh | All modules loaded successfully');
    
    // Initialize game.poundOfFlesh object
    if (!game.poundOfFlesh) {
      game.poundOfFlesh = {};
    }
    
    // Initialize managers
    game.poundOfFlesh = {
      cyberwareManager: new CyberwareManager(),
      actorMods: new ActorSheetModifications(),
      itemMods: new ItemSheetModifications(),
      templateManager: TemplateInjectionManager
    };
    
    // Store reference in module for external access
    const module = game.modules.get('pound-of-flesh');
    if (module) {
      module.cyberwareManager = game.poundOfFlesh.cyberwareManager;
      module.actorMods = game.poundOfFlesh.actorMods;
      module.itemMods = game.poundOfFlesh.itemMods;
      module.templateManager = TemplateInjectionManager;
    }
    
    console.log('Pound of Flesh | Managers created and stored');
    
  } catch (error) {
    console.error('Pound of Flesh | Failed to load modules:', error);
    ui.notifications.error('Erreur de chargement du module Pound of Flesh');
  }
});

// Module ready
Hooks.once('ready', async () => {
  console.log('Pound of Flesh | Module ready');
  
  // CORRECTION AUTOMATIQUE v13 - Nettoyer les hooks dépréciés au démarrage
  try {
    await applyV13CompatibilityFixes();
  } catch (error) {
    console.warn('Pound of Flesh | Correction automatique échouée:', error.message);
  }
  
  // Initialize all managers first (always initialize for API access)
  if (game.poundOfFlesh?.cyberwareManager) {
    game.poundOfFlesh.cyberwareManager.initialize();
  }
  if (game.poundOfFlesh?.actorMods) {
    game.poundOfFlesh.actorMods.initialize();
  }
  if (game.poundOfFlesh?.itemMods) {
    game.poundOfFlesh.itemMods.initialize();
  }
  if (TemplateInjectionManager) {
    game.poundOfFlesh.templateInjectionManager = TemplateInjectionManager;
    await TemplateInjectionManager.initialize();
  }

  // Exposer les fonctions de correction pour usage manuel si nécessaire
  if (!game.poundOfFlesh) {
    game.poundOfFlesh = {};
  }
  game.poundOfFlesh.applyV13Fixes = applyV13CompatibilityFixes;
  game.poundOfFlesh.verifyHooks = verifyPOFHooksStatus;

  // VÉRIFICATION POST-INITIALISATION v13
  setTimeout(() => {
    verifyPOFHooksStatus();
  }, 1000);
  
  // Check system compatibility
  if (game.system.id !== 'mothership-fr') {
    console.warn('Pound of Flesh | This module is designed for the Mothership-Fr system');
    ui.notifications.warn('Le module Pound of Flesh est conçu pour le système Mothership-Fr');
  }
  
  if (!game.settings.get('pound-of-flesh', 'enableCybermods')) {
    console.log('Pound of Flesh | Module disabled in settings');
    return;
  }

  // Show notification only if enabled
  ui.notifications.info(game.i18n.localize('POUNDOFFLESH.Notifications.ModuleLoaded'));
  
  console.log('Pound of Flesh | All systems operational');
});

/**
 * CORRECTION AUTOMATIQUE FOUNDRY v13
 * Applique les corrections de compatibilité au démarrage
 */
async function applyV13CompatibilityFixes() {
  console.log('Pound of Flesh | Applying v13 compatibility fixes...');
  
  // Vérifications préliminaires
  if (!Hooks || !game) {
    console.warn('Pound of Flesh | Environment not ready for v13 fixes');
    return;
  }

  // Accès robuste aux hooks
  let hooksAccess = null;
  try {
    if (typeof Hooks !== 'undefined' && Hooks._hooks) {
      hooksAccess = Hooks._hooks;
    } else if (typeof Hooks !== 'undefined' && Hooks.events) {
      hooksAccess = Hooks.events;
    } else if (typeof game !== 'undefined' && game.hooks && game.hooks._hooks) {
      hooksAccess = game.hooks._hooks;
    }
  } catch (error) {
    console.warn('Pound of Flesh | Could not access hooks for v13 fixes:', error.message);
    return;
  }

  if (!hooksAccess) {
    console.warn('Pound of Flesh | No hooks access available for v13 fixes');
    return;
  }

  let cleaned = 0;

  try {
    // Nettoyer les hooks dépréciés renderChatMessage du système (méthode v13 sécurisée)
    if (hooksAccess['renderChatMessage']) {
      const hooksToRemove = hooksAccess['renderChatMessage'].filter(h => {
        const fnString = h.fn ? h.fn.toString() : '';
        return fnString.includes('rollable-table') || 
               fnString.includes('game.tables') ||
               fnString.includes('_onRenderChatMessage');
      });
      
      hooksToRemove.forEach(hook => {
        try {
          if (hook.fn) {
            Hooks.off('renderChatMessage', hook.fn);
            cleaned++;
          }
        } catch (e) {
          // Hook déjà supprimé ou erreur, continuer silencieusement
        }
      });
    }

    // Nettoyer les anciens hooks POF défectueux
    if (hooksAccess['renderMothershipActorSheet']) {
      const oldHooks = hooksAccess['renderMothershipActorSheet'].filter(h => {
        const fnString = h.fn ? h.fn.toString() : '';
        // Ne supprimer que les anciens hooks problématiques, pas les nouveaux
        return fnString.includes('pound-of-flesh-old') || 
               fnString.includes('deprecated') ||
               (fnString.includes('cyber') && fnString.includes('legacy'));
      });
      
      let pofCleaned = 0;
      oldHooks.forEach(hook => {
        try {
          if (hook.fn) {
            Hooks.off('renderMothershipActorSheet', hook.fn);
            pofCleaned++;
          }
        } catch (e) {
          // Hook déjà supprimé ou erreur, continuer silencieusement
        }
      });
      
      if (pofCleaned > 0) {
        console.log(`Pound of Flesh | Cleaned ${pofCleaned} legacy POF hooks`);
      }
    }

    if (cleaned > 0) {
      console.log(`Pound of Flesh | v13 compatibility fixes applied - cleaned ${cleaned} deprecated hooks`);
    } else {
      console.log('Pound of Flesh | v13 compatibility - no deprecated hooks to clean');
    }

  } catch (error) {
    console.warn('Pound of Flesh | Error during v13 compatibility fixes:', error.message);
  }
}

// Hook for actor updates (stat changes affect slot calculation)
Hooks.on('updateActor', (actor, data, options, userId) => {
  if (!game.settings.get('pound-of-flesh', 'enableCybermods')) return;
  
  if (actor.type === 'character' && data.system?.stats) {
    game.poundOfFlesh.cyberwareManager.onActorUpdate(actor, data);
  }
});

// Hook for item updates (cyberware flag changes)
Hooks.on('updateItem', (item, data, options, userId) => {
  if (!game.settings.get('pound-of-flesh', 'enableCybermods')) return;
  
  // Vérification sécurisée pour éviter les erreurs avec les booléens
  const hasCyberUpdate = (data.system && 'cyber' in data.system);
  const hasCyberTypeUpdate = (data.system && 'cyberType' in data.system);
  
  if (hasCyberUpdate || hasCyberTypeUpdate) {
    game.poundOfFlesh?.cyberwareManager?.onItemUpdate(item, data);
  }
});

// Hook for preCreateItem (auto-calculate slots for custom cybermods)
Hooks.on('preCreateItem', (item, data, options, userId) => {
  if (!game.settings.get('pound-of-flesh', 'enableCybermods')) return;
  
  if (data.system?.cyber || data.system?.cyberType) {
    game.poundOfFlesh.cyberwareManager.onPreCreateItem(item, data);
  }
});

/**
 * VÉRIFICATION STATUS HOOKS POF
 * Vérifie que les hooks POF sont correctement enregistrés après initialisation
 */
function verifyPOFHooksStatus() {
  console.log('Pound of Flesh | Verifying hooks status...');
  
  let hooksAccess = null;
  try {
    if (typeof Hooks !== 'undefined' && Hooks._hooks) {
      hooksAccess = Hooks._hooks;
    } else if (typeof Hooks !== 'undefined' && Hooks.events) {
      hooksAccess = Hooks.events;
    } else if (typeof game !== 'undefined' && game.hooks && game.hooks._hooks) {
      hooksAccess = game.hooks._hooks;
    }
  } catch (error) {
    console.warn('Pound of Flesh | Could not access hooks for verification:', error.message);
    return false;
  }

  if (!hooksAccess) {
    console.warn('Pound of Flesh | No hooks access for verification');
    return false;
  }

  const pofHooks = hooksAccess['renderMothershipActorSheet']?.length || 0;
  const deprecatedHooks = hooksAccess['renderChatMessage']?.length || 0;
  
  console.log(`Pound of Flesh | Hooks status: ${pofHooks} POF hooks, ${deprecatedHooks} deprecated hooks`);
  
  // Ne pas essayer de restaurer manuellement si les gestionnaires ne sont pas prêts
  if (pofHooks === 0 && game.poundOfFlesh?.actorMods?.onRenderActorSheet) {
    console.log('Pound of Flesh | POF hooks missing but managers ready - attempting manual hook restoration');
    
    try {
      Hooks.on('renderMothershipActorSheet', game.poundOfFlesh.actorMods.onRenderActorSheet.bind(game.poundOfFlesh.actorMods));
      console.log('Pound of Flesh | Manual hook restoration successful');
      return true;
    } catch (error) {
      console.error('Pound of Flesh | Manual hook restoration failed:', error.message);
      return false;
    }
  } else if (pofHooks === 0) {
    console.log('Pound of Flesh | POF hooks missing - managers not yet ready, will retry later');
    return false;
  }
  
  if (pofHooks > 0) {
    console.log('Pound of Flesh | Hooks verification successful');
    return true;
  }
  
  return false;
}

console.log('Pound of Flesh | All hooks registered');