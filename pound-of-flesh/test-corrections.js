/**
 * Script de test pour les corrections Foundry v13 - Pound of Flesh
 */

// Test de base pour vérifier que les classes se chargent
async function testModuleLoading() {
  console.log('=== TEST CHARGEMENT MODULE ===');
  
  try {
    // Tester l'import des modules
    const cyberwareModule = await import('./scripts/cyberware-manager.js');
    console.log('✅ CyberwareManager importé');
    
    const actorSheetModule = await import('./scripts/actor-sheet-mods.js');
    console.log('✅ ActorSheetModifications importé');
    
    // Tester l'instanciation
    const cyberwareManager = new cyberwareModule.CyberwareManager();
    console.log('✅ CyberwareManager instancié');
    
    const actorMods = new actorSheetModule.ActorSheetModifications();
    console.log('✅ ActorSheetModifications instancié');
    
    console.log('✅ TOUS LES MODULES SE CHARGENT CORRECTEMENT');
    return true;
    
  } catch (error) {
    console.error('❌ ERREUR DE CHARGEMENT:', error);
    return false;
  }
}

// Test des corrections v13
function testV13Corrections() {
  console.log('=== TEST CORRECTIONS V13 ===');
  
  try {
    // Tester l'accès aux hooks
    if (typeof Hooks !== 'undefined') {
      console.log('✅ Hooks disponible');
      
      // Tester l'accès à la structure interne
      const hooksAccess = Hooks._hooks || Hooks.events;
      if (hooksAccess) {
        console.log('✅ Structure interne hooks accessible');
        console.log(`Hooks enregistrés: ${Object.keys(hooksAccess).length}`);
      } else {
        console.log('❌ Structure interne hooks non accessible');
      }
    } else {
      console.log('❌ Hooks non disponible');
    }
    
    // Tester l'existence de game.poundOfFlesh
    if (typeof game !== 'undefined' && game.poundOfFlesh) {
      console.log('✅ game.poundOfFlesh existe');
      
      if (game.poundOfFlesh.applyV13Fixes) {
        console.log('✅ Fonction applyV13Fixes disponible');
      } else {
        console.log('❌ Fonction applyV13Fixes manquante');
      }
      
      if (game.poundOfFlesh.verifyHooks) {
        console.log('✅ Fonction verifyHooks disponible');
      } else {
        console.log('❌ Fonction verifyHooks manquante');
      }
    } else {
      console.log('❌ game.poundOfFlesh non initialisé');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ ERREUR CORRECTIONS V13:', error);
    return false;
  }
}

// Exporter les fonctions de test
window.pofTests = {
  testModuleLoading,
  testV13Corrections
};

console.log('📋 Tests POF disponibles dans window.pofTests');
console.log('   - testModuleLoading()');
console.log('   - testV13Corrections()');