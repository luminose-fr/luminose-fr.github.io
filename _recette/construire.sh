#!/usr/bin/env bash
# Construit une version du site comme la production la construit, dans un
# dossier jetable, et n'en garde que les fichiers ordinaires.
#
#   _recette/construire.sh <révision> <sortie> [--recette]
#
# - la révision est extraite par `git archive` dans un dossier temporaire : la
#   copie de travail n'est pas touchée, et les variantes d'images que le greffon
#   image_variants_generator écrit à côté des sources restent dans le jetable ;
# - `scripts/construire.sh` s'il existe dans la révision, sinon
#   `bundle exec jekyll build`, avec JEKYLL_ENV=production et --baseurl "" comme
#   le workflow jekyll.yml ; avec --recette, _config.recette.yml vient EN SECOND
#   — celui de ce dossier, pour qu'une branche plus ancienne que la recette
#   puisse y aller aussi ;
# - la sortie ne garde que des fichiers ordinaires : ni lien symbolique, ni
#   rien d'autre, qui pourrait faire servir un fichier hors du site.
#
# Si `bundle exec jekyll` ne marche pas tel quel dans le shell (Ruby par rbenv,
# Gemfile à part), RECETTE_ENV nomme un fichier à sourcer avant la construction.
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "usage : $0 <révision> <sortie> [--recette]" >&2
  exit 2
fi
revision=$1
sortie=$2
recette=${3:-}
ici=$(cd "$(dirname "$0")" && pwd)
depot=$(git -C "$ici" rev-parse --show-toplevel)

if [[ -n "${RECETTE_ENV:-}" ]]; then
  # shellcheck disable=SC1090
  . "$RECETTE_ENV"
fi

jetable=$(mktemp -d "${TMPDIR:-/tmp}/luminose-construction.XXXXXX")
trap 'rm -rf "$jetable"' EXIT

git -C "$depot" archive --format=tar "$revision" | tar -x -C "$jetable/"
mkdir -p "$jetable/_construit"

options=(--baseurl "" --destination "$jetable/_construit")
if [[ "$recette" == "--recette" ]]; then
  cp "$ici/../_config.recette.yml" "$jetable/_config.recette.yml"
  options+=(--config _config.yml,_config.recette.yml)
elif [[ -n "$recette" ]]; then
  echo "option inconnue : $recette" >&2
  exit 2
fi

(
  cd "$jetable"
  export JEKYLL_ENV=production
  if [[ -x scripts/construire.sh ]]; then
    scripts/construire.sh "${options[@]}"
  else
    bundle exec jekyll build "${options[@]}"
  fi
) >&2

rm -rf "$sortie"
mkdir -p "$sortie"
# Les fichiers ordinaires seulement, chemins conservés.
(cd "$jetable/_construit" && find . -type f -print0 | tar --null -cf - -T -) | tar -x -C "$sortie"
autres=$(cd "$jetable/_construit" && find . ! -type f ! -type d | wc -l)
if [[ "$autres" -gt 0 ]]; then
  echo "construire : $autres élément(s) qui ne sont pas des fichiers ordinaires écartés" >&2
fi
