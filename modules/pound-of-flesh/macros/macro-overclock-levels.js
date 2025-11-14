// ============================================================================
// MACRO FOUNDRY V13 - NIVEAUX OVERCLOCK POUND OF FLESH
// Compatible Mothership-Fr - Affichage des effets de surcadencement
// ============================================================================

const OVERCLOCK_DATA = {
  1: "Stress minimum augmenté de +1.",
  2: "Troublant. Gagnez la Réponse Traumatique de l'androïde : vous causez maintenant aux autres dans votre voisinage de gagner [-] sur les Jets de Peur. Les androïdes donnent maintenant à tous autour d'eux 1 Stress chaque fois qu'ils échouent un Jet de Peur.",
  3: "Stress minimum augmenté de +2.",
  4: "Retiré. Vous ne faites plus de Jets de Peur. Vous ne faites plus de Tests de Panique pour voir d'autres mourir, pour voir d'autres Paniquer, ou pour vous sentir désespéré.",
  5: "Moins qu'humain. La machine a le contrôle. Le Gardien prend le contrôle de votre personnage."
};

async function showOverclockLevels() {
  // Vérifier le système
  if (game.system.id !== 'mothership-fr') {
    ui.notifications.error("Cette macro nécessite le système Mothership-Fr");
    return;
  }

  // Sélection du niveau ou affichage de tous
  const level = await foundry.applications.api.DialogV2.wait({
    window: { title: "Niveaux de Surcadencement" },
    position: { width: 500, height: 350 },
    content: `
      <div style="padding: 15px; background: #1a1a1a; color: #fff; border: 2px solid #782e22;">
        <h3 style="color: #ff6400; margin-bottom: 15px;">
          <i class="fas fa-cogs"></i> Effets de Surcadencement
        </h3>
        <p>Choisissez le niveau à afficher ou voir tous les niveaux :</p>
        <div style="margin: 15px 0;">
          <label for="level-select" style="display: block; margin-bottom: 8px;">Niveau de Surcadencement :</label>
          <select id="level-select" style="width: 100%; padding: 5px; background: #333; color: #fff; border: 1px solid #777;">
            <option value="all">Tous les niveaux</option>
            <option value="1">Niveau 1</option>
            <option value="2">Niveau 2</option>
            <option value="3">Niveau 3</option>
            <option value="4">Niveau 4</option>
            <option value="5">Niveau 5</option>
          </select>
        </div>
      </div>
    `,
    buttons: [
      {
        action: "show",
        icon: '<i class="fas fa-eye"></i>',
        label: "Afficher",
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
              const selectElement = form.querySelector('#level-select');
              if (selectElement) {
                return selectElement.value;
              }
            }
          } catch (err) {
            console.warn('Pound of Flesh | Could not access level selection:', err);
          }
          return null;
        }
      },
      {
        action: "cancel",
        icon: '<i class="fas fa-times"></i>',
        label: "Annuler",
        callback: () => null
      }
    ],
    default: "show"
  });

  if (!level) return;

  let content;
  
  if (level === "all") {
    // Afficher tous les niveaux
    content = `
      <div style="border: 2px solid #782e22; padding: 15px; background: rgba(120, 46, 34, 0.1);">
        <h3 style="margin: 0 0 15px 0; color: #ff6400; border-bottom: 1px solid #782e22; padding-bottom: 8px;">
          <i class="fas fa-cogs"></i> Tous les Niveaux de Surcadencement
        </h3>
        ${Object.entries(OVERCLOCK_DATA).map(([lvl, effect]) => `
          <div style="margin-bottom: 15px; padding: 12px; background: rgba(0,0,0,0.3); border-left: 4px solid #ff6400; border-radius: 3px;">
            <h4 style="margin: 0 0 8px 0; color: #ff6400;">
              <i class="fas fa-bolt"></i> Niveau ${lvl}
            </h4>
            <p style="margin: 0; line-height: 1.4;">${effect}</p>
          </div>
        `).join('')}
        <div style="margin-top: 20px; padding: 10px; background: rgba(255, 100, 0, 0.1); border: 1px solid #ff6400; border-radius: 3px;">
          <p style="margin: 0; font-style: italic; color: #ccc;">
            <strong>Rappel :</strong> Les effets de surcadencement sont cumulatifs et permanents jusqu'à ce que le nombre de cybermods soit réduit.
          </p>
        </div>
      </div>
    `;
  } else {
    // Afficher un niveau spécifique
    const effect = OVERCLOCK_DATA[level];
    content = `
      <div style="border: 2px solid #782e22; padding: 15px; background: rgba(120, 46, 34, 0.1);">
        <h3 style="margin: 0 0 15px 0; color: #ff6400; border-bottom: 1px solid #782e22; padding-bottom: 8px;">
          <i class="fas fa-bolt"></i> Niveau de Surcadencement ${level}
        </h3>
        <div style="padding: 15px; background: rgba(0,0,0,0.3); border-left: 4px solid #ff6400; border-radius: 3px;">
          <p style="margin: 0; font-size: 16px; line-height: 1.5;">${effect}</p>
        </div>
        <div style="margin-top: 15px; padding: 8px; background: rgba(255, 100, 0, 0.1); border: 1px solid #ff6400; border-radius: 3px;">
          <p style="margin: 0; font-size: 12px; font-style: italic; color: #ccc;">
            <i class="fas fa-info-circle"></i> Cet effet s'ajoute aux effets des niveaux précédents.
          </p>
        </div>
      </div>
    `;
  }

  // Créer le message de chat
  await ChatMessage.create({
    content: content,
    speaker: ChatMessage.getSpeaker(),
    type: CONST.CHAT_MESSAGE_TYPES.OTHER
  });

  ui.notifications.info(`Niveaux de surcadencement affichés dans le chat`);
}

// Exécution de la macro
showOverclockLevels();