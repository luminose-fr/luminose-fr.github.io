#!/usr/bin/env bash
# Met une branche en recette, sur https://recette.luminose.fr.
#
#   _recette/mettre-en-recette.sh <branche>           construit, montre, déploie, contrôle
#   _recette/mettre-en-recette.sh <branche> --essai   construit et montre tout, ne déploie rien
#
# Florent seul le lance, depuis la VM, dans une copie de master à jour et
# propre : c'est master qui porte la recette (le Worker, sa configuration, ce
# script), et n'importe quelle branche poussée peut y aller.
#
# 1. refuse si la copie n'est pas sur master, à jour d'origin et sans
#    modification suivie ;
# 2. construit la branche telle qu'elle est sur origin, comme la production la
#    construit, avec _config.recette.yml en second (construire.sh) ; ne garde
#    que les fichiers ordinaires ;
# 3. montre ce qu'il va faire, et attend un « oui » ;
# 4. déploie avec le wrangler de la VM, sur le compte Cloudflare de Luminose
#    (~/.cf-luminose, ou RECETTE_CF) — jamais le compte par défaut ;
# 5. si le mot de passe n'est pas posé, le fait poser (`wrangler secret put`,
#    tapé au clavier) ; tant qu'il ne l'est pas, la recette répond 401 partout ;
# 6. contrôle la recette (controler.sh) ; en cas d'échec, la FERME en
#    supprimant le mot de passe ;
# 7. affiche la branche et le commit en recette.
set -euo pipefail

ici=$(cd "$(dirname "$0")" && pwd)
depot=$(git -C "$ici" rev-parse --show-toplevel)
NOM=luminose-site-recette
DOMAINE=recette.luminose.fr
LIMITE_FICHIERS=20000          # le plan gratuit des Workers
LIMITE_OCTETS=$((25 * 1024 * 1024)) # par fichier

branche=${1:-}
essai=0
[[ "${2:-}" == "--essai" ]] && essai=1
if [[ -z "$branche" || "$branche" == --* ]]; then
  echo "usage : $0 <branche> [--essai]" >&2
  exit 2
fi
arreter() { echo "mettre-en-recette : $*" >&2; exit 1; }

# ─── 1. Une copie de master, à jour et propre ───────────────────────────────
cd "$depot"
[[ "$(git symbolic-ref --short -q HEAD)" == master ]] || arreter "la copie doit être sur master (git switch master)."
[[ -z "$(git status --porcelain --untracked-files=no)" ]] || arreter "la copie a des modifications suivies ; les committer ou les mettre de côté."
git fetch -q origin master "$branche" || arreter "la branche « $branche » est introuvable sur origin."
[[ "$(git rev-parse HEAD)" == "$(git rev-parse origin/master)" ]] || arreter "master n'est pas à jour d'origin (git pull)."
commit=$(git rev-parse "origin/$branche")
court=${commit:0:7}

# ─── 2. La construction ─────────────────────────────────────────────────────
site="$ici/site"
echo "Construction de $branche ($court) pour la recette…"
"$ici/construire.sh" "$commit" "$site" --recette
fichiers=$(find "$site" -type f | wc -l | tr -d ' ')
taille=$(du -sh "$site" | cut -f1)
[[ "$fichiers" -gt 0 ]] || arreter "la construction est vide."
[[ "$fichiers" -le $LIMITE_FICHIERS ]] || arreter "$fichiers fichiers : plus que les $LIMITE_FICHIERS du plan gratuit."
gros=$(find "$site" -type f -size +"$LIMITE_OCTETS"c | head -3)
[[ -z "$gros" ]] || arreter "fichiers de plus de 25 Mio : $gros"
[[ -z "$(find "$site" ! -type f ! -type d)" ]] || arreter "la construction contient autre chose que des fichiers ordinaires."

# ─── wrangler, sur le compte de Luminose ────────────────────────────────────
cd "$ici"
[[ -d node_modules ]] || npm ci --no-audit --no-fund
wrangler() { npx --no-install wrangler "$@"; }
export WRANGLER_SEND_METRICS=false
compte=${RECETTE_CF:-$HOME/.cf-luminose}
if [[ -f "$compte" ]]; then
  # shellcheck disable=SC1090
  . "$compte"
fi

# ─── 3. Ce qui va se faire ──────────────────────────────────────────────────
cat <<EOF

  Branche      $branche
  Commit       $commit
  Construction $fichiers fichiers, $taille
  Worker       $NOM, sur https://$DOMAINE seulement (ni workers.dev, ni aperçu)
  wrangler     $(wrangler --version 2>/dev/null | tail -1)
  Compte       ${CLOUDFLARE_ACCOUNT_ID:+…${CLOUDFLARE_ACCOUNT_ID: -6}}${CLOUDFLARE_ACCOUNT_ID:-non défini}

  Commande     wrangler deploy --var RECETTE_BRANCHE:$branche --var RECETTE_COMMIT:$court
  Puis         le mot de passe s'il manque, et controler.sh

EOF

if [[ $essai -eq 1 ]]; then
  echo "Essai : la construction est dans $site ; wrangler deploy --dry-run :"
  CLOUDFLARE_CF_FETCH_ENABLED=false wrangler deploy --dry-run --outdir "$ici/.wrangler/essai" \
    --var "RECETTE_BRANCHE:$branche" --var "RECETTE_COMMIT:$court"
  echo "Essai terminé : rien n'a été déployé."
  exit 0
fi

[[ -n "${CLOUDFLARE_ACCOUNT_ID:-}" ]] || arreter "CLOUDFLARE_ACCOUNT_ID n'est pas défini ($compte) : sans lui, wrangler déploierait sur le compte par défaut."
read -rp "Déployer en recette ? Taper « oui » : " reponse </dev/tty
[[ "$reponse" == oui ]] || arreter "rien n'a été déployé."

# ─── 4. Le déploiement ──────────────────────────────────────────────────────
wrangler deploy --var "RECETTE_BRANCHE:$branche" --var "RECETTE_COMMIT:$court"

# ─── 5. Le mot de passe ─────────────────────────────────────────────────────
if ! wrangler secret list --format json 2>/dev/null | grep -q '"RECETTE_MOT_DE_PASSE"'; then
  echo
  echo "Le mot de passe n'est pas posé : la recette répond 401 partout. Le poser maintenant :"
  wrangler secret put RECETTE_MOT_DE_PASSE
fi

# ─── 6. Le contrôle ─────────────────────────────────────────────────────────
echo
read -rsp "Mot de passe de la recette, pour le contrôle : " RECETTE_MOT_DE_PASSE </dev/tty
echo
export RECETTE_MOT_DE_PASSE
if ! "$ici/controler.sh" </dev/null; then
  unset RECETTE_MOT_DE_PASSE
  echo
  echo "Le contrôle a échoué : la recette est FERMÉE (suppression du mot de passe)."
  CI=true wrangler secret delete RECETTE_MOT_DE_PASSE </dev/null || true
  if wrangler secret list --format json 2>/dev/null | grep -q '"RECETTE_MOT_DE_PASSE"'; then
    echo "ATTENTION : le mot de passe est toujours là. Le supprimer à la main :" >&2
    echo "  cd $ici && npx wrangler secret delete RECETTE_MOT_DE_PASSE" >&2
  fi
  exit 1
fi
unset RECETTE_MOT_DE_PASSE

# ─── 7. Ce qui est en recette ───────────────────────────────────────────────
echo
echo "En recette sur https://$DOMAINE : $branche, $commit"
