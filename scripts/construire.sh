#!/bin/sh
# La construction du site, en un seul chemin : le workflow GitHub l'appelle, et
# on peut la lancer en local. Elle fait `jekyll build`, puis allège les deux
# feuilles publiées (scripts/alleger/), puis contrôle qu'aucune classe utilisée
# n'a perdu sa règle : sinon, elle échoue, et la publication avec.
#
#   ./scripts/construire.sh [options de jekyll build]      ex. --baseurl "" -d /tmp/site
#
# Les outils de l'allègement s'installent une fois, d'eux-mêmes s'ils manquent.
# `./run.sh` reste le serveur de travail : il sert les feuilles complètes, sans retrait.
set -eu

racine=$(cd "$(dirname "$0")/.." && pwd)
cd "$racine"

# Le dossier de sortie : celui de -d / --destination s'il est donné, sinon _site.
destination="_site"
precedent=""
for argument in "$@"; do
  case "$precedent" in -d|--destination) destination="$argument" ;; esac
  case "$argument" in --destination=*) destination="${argument#--destination=}" ;; esac
  precedent="$argument"
done

# Absents (une copie neuve, la construction de la recette), ils s'installent ici,
# à la version que leur package-lock.json fixe.
if [ ! -d scripts/alleger/node_modules ]; then
  npm ci --prefix scripts/alleger --no-audit --no-fund >&2 || {
    echo "Les outils de l'allègement manquent : npm ci --prefix scripts/alleger" >&2
    exit 1
  }
fi

bundle exec jekyll build "$@"
node scripts/alleger/alleger.mjs "$destination"
