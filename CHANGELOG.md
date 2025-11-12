# Changelog - Pound of Flesh

## Version 1.0.0 (2025-11-11)

### 🎉 Version Finale - Foundry v13 Intégré

#### ✅ Fonctionnalités principales
- **Cyberware & Slickware complets** : Gestion automatique des emplacements et effets
- **Onglet Cyber** : Interface dédiée sur les fiches de personnage
- **Tests d'installation** : Système de difficultés et échecs/réussites
- **Règles de surcharge** : Mécaniques Pound of Flesh officielles
- **Compendiums intégrés** : Cyberware, Slickware, et Tables aléatoires

#### 🔧 Corrections techniques majeures
- **Patch Foundry v13 intégré** : Correction automatique au démarrage
- **Nettoyage hooks dépréciés** : Suppression des APIs obsolètes
- **Méthode sécurisée** : Utilisation de `Hooks.off()` au lieu de modification directe
- **Vérification automatique** : Auto-diagnostic et restauration des hooks POF

#### 🧹 Nettoyage du module
- **Scripts épurés** : Suppression de tous les scripts de correction temporaires
- **Documentation rationalisée** : Une seule documentation complète
- **Macros essentielles** : Conservées uniquement les macros fonctionnelles
- **Structure simplifiée** : Module optimisé et allégé

#### ⚙️ Architecture
```
pound-of-flesh/
├── module.json              (Manifeste)
├── pound-of-flesh.js        (Point d'entrée patché v13)
├── README.md                (Documentation complète)
├── CHANGELOG.md             (Ce fichier)
├── scripts/                 (Logique du module)
│   ├── cyberware-manager.js
│   ├── actor-sheet-mods.js
│   ├── item-sheet-mods.js
│   └── template-injection-manager.js
├── styles/                  (CSS)
├── lang/                    (Traductions FR)
├── templates/               (Templates HTML)
├── packs/                   (Compendiums)
│   ├── cyberware-items/
│   ├── slickware-items/
│   └── pound-of-flesh-tables/
└── macros/                  (Macros utilitaires)
    ├── install-cybermods-master.js
    ├── macro-foundry-tables.js
    ├── macro-foundry-tables-v2.js
    ├── macro-cleanup-tables.js
    └── macro-overclock-levels.js
```

#### 🎯 Résultat final
- ✅ **Module entièrement fonctionnel** avec Foundry v13
- ✅ **Correction automatique intégrée** - plus besoin d'intervention
- ✅ **Onglet Cyber opérationnel** dès le démarrage
- ✅ **Structure épurée** - finies les corrections temporaires
- ✅ **Documentation unique** et complète
- ✅ **Prêt pour utilisation en production**

### Supprimés dans cette version
- ❌ 40+ scripts de correction/diagnostic temporaires
- ❌ 15+ fichiers de documentation de débogage  
- ❌ Dossier `patches/` complet
- ❌ Macros de test et validation
- ❌ Scripts d'ancien système (actor-sheet-mods-old.js)

### Migration depuis versions précédentes
1. Sauvegarder votre monde
2. Remplacer le dossier pound-of-flesh complet
3. Redémarrer Foundry
4. Le module applique automatiquement toutes les corrections

---

**Le module est maintenant stable et définitif pour Foundry v13 !**