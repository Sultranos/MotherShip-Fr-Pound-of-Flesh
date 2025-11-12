# Pound of Flesh - Module Cybermods pour Mothership-Fr# Pound of Flesh - Module Cybermods pour Mothership-Fr



## Description## Description



Ce module ajoute les règles de cyberware et slickware du supplément **Pound of Flesh** au système Mothership-Fr. Il inclut les mécaniques d'installation, la gestion des emplacements, et les règles de surcadence.Ce module ajoute les mécaniques de cybermods (cyberware et slickware) au système Mothership-Fr de Foundry VTT, basé sur le supplément "Pound of Flesh".



## Fonctionnalités## Fonctionnalités



### Cyberware & Slickware- **Onglet Cybermods** : Remplace l'onglet Notes des feuilles de personnage par un onglet dédié aux cybermods

- **Gestion des emplacements** : Calcul automatique des slots disponibles- **Gestion des slots** : Calcul automatique des slots disponibles basé sur Force/10 (cyberware) et Intellect/10 (slickware)

- **Installation cyberware** : Système de tests d'installation avec difficultés variables- **Cases cyber** : Ajout de cases "Cyber" aux feuilles d'armes et d'objets

- **Règles de surcharge** : Gestion des effets de surcadence- **Installation** : Système complet d'installation avec jets de dés et conséquences

- **Onglet Cyber** : Interface dédiée sur les fiches de personnage- **Overclocking** : Mécaniques d'overclocking pour les cyberware

- **Interface française** : Toutes les chaînes de texte sont traduites en français

### Contenu inclus

- **Compendiums Cyberware** : Items de cyberware avec stats complètes## Installation

- **Compendiums Slickware** : Items de slickware optimisés  

- **Tables aléatoires** : Tables de génération et d'effets Pound of Flesh1. Placez le dossier `pound-of-flesh` dans le répertoire `modules` de Foundry VTT

- **Macros utilitaires** : Outils pour la gestion des cybermods2. Redémarrez Foundry VTT

3. Activez le module dans la configuration des modules de votre monde

## Installation4. Le module nécessite le système Mothership-Fr pour fonctionner



1. Télécharger le module dans le dossier modules de Foundry## Utilisation

2. Activer le module dans la configuration du monde

3. Redémarrer le monde pour appliquer les changements### Configuration des objets



## Compatibilité1. **Marquer un objet comme cyber** :

   - Ouvrez la feuille d'un objet ou d'une arme

- **Foundry VTT** : v12.x à v13.x   - Cochez la case "Objet Cybernétique"

- **Système requis** : Mothership-Fr v1.8.0+   - Sélectionnez le type : Cyberware ou Slickware

- **Auto-correction v13** : Le module s'adapte automatiquement à Foundry v13   - Configurez les slots requis et autres propriétés



## Utilisation2. **Types de cybermods** :

   - **Cyberware** : Implants physiques (slots basés sur Force)

### Gestion des cybermods   - **Slickware** : Programmes neuraux (nécessitent une Slicksocket)

1. Ouvrir une fiche de personnage   - **Objets cyber** : Objets marqués comme cybernétiques

2. Aller dans l'onglet **Cyber**

3. Ajouter des cybermods via glisser-déposer ou depuis les compendiums### Feuille de personnage

4. Le module calcule automatiquement les emplacements et effets

L'onglet **Cybermods** remplace l'onglet Notes et affiche :

### Tests d'installation- Le nombre de slots disponibles/utilisés

- Utiliser la macro `install-cybermods-master.js` - Les cyberware installés

- Ou utiliser les fonctions intégrées dans l'interface- Les slickware installés

- Les objets cyber standard

### Tables aléatoires

- Accéder aux tables via les compendiums### Mécaniques de jeu

- Utiliser les macros `macro-foundry-tables*.js` pour l'automatisation

1. **Installation** :

## Architecture technique   - Test de Corps pour le cyberware

   - Test de Sanité pour le slickware

### Fichiers principaux   - Conséquences selon le résultat du jet

- `pound-of-flesh.js` : Point d'entrée et initialisation (patché v13)

- `scripts/cyberware-manager.js` : Logique de gestion des cybermods2. **Overclocking** :

- `scripts/actor-sheet-mods.js` : Modifications des fiches de personnage   - Permet d'installer plus de cybermods que les slots disponibles

- `scripts/item-sheet-mods.js` : Modifications des fiches d'items   - Augmente les risques et coûts

- `scripts/template-injection-manager.js` : Gestion des templates

3. **Dysfonctionnements** :

### Correction automatique v13   - Système de pannes pour les cybermods

Le module intègre une correction automatique pour Foundry v13 :

- Nettoyage des hooks dépréciés au démarrage## Paramètres

- Vérification et restauration des hooks POF

- Compatibilité totale sans intervention manuelleLe module propose plusieurs paramètres configurables :



## Dépannage- **Activer les cybermods** : Active/désactive le module

- **Mode debug** : Active les logs de débogage

### Problèmes courants- **Modificateur de difficulté** : Ajuste la difficulté des installations



**Onglet Cyber non visible :**## Compatibilité

- Vérifier que le module est activé

- Redémarrer le monde (F5)- **Foundry VTT** : v12-13

- Le module se corrige automatiquement au démarrage- **Système requis** : Mothership-Fr v1.8.0+

- **Modules recommandés** : Aucun

**Erreurs de console :**

- Le module gère automatiquement la compatibilité v13## Support et bugs

- Pas d'intervention manuelle nécessaire

Ce module est une adaptation du supplément "Pound of Flesh" pour le système Mothership-Fr. Il a été conçu pour respecter les règles officielles tout en s'intégrant parfaitement au système français.

### API de diagnostic

Si besoin, utiliser dans la console F12 :## Crédits

```javascript

game.poundOfFlesh.verifyHooks()    // Vérifier les hooks- **Supplément original** : Pound of Flesh pour Mothership

game.poundOfFlesh.applyV13Fixes()  // Réappliquer corrections- **Adaptation** : Module pour Mothership-Fr

```- **Traduction française** : Textes et interface entièrement en français



## Support## Version



Pour les bugs et problèmes :Version actuelle : 1.0.0

1. Vérifier la compatibilité Foundry/Mothership-Fr

2. Redémarrer le monde (F5)Compatible avec :

3. Consulter les logs de console (F12)- Foundry VTT v12-13

- Mothership-Fr v1.8.0+
## Licence

MIT - Libre d'utilisation et modification

---

**Version 1.0.0** - Compatible Foundry v13 avec correction automatique intégrée