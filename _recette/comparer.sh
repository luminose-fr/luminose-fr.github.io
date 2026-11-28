#!/usr/bin/env bash
# Compare deux constructions du site, `diff -r`, à l'heure de construction près.
#
#   _recette/comparer.sh <construction-a> <construction-b> [--recette]
#
# Deux constructions du même commit ne sont jamais identiques à l'octet : le
# site date ses feuilles et ses scripts (`?v=` suivi de site.time, en secondes)
# et le sitemap date ses pages sans date (<lastmod>). Ces deux marques sont
# ramenées à une valeur fixe, dans une copie. Les variantes d'images que
# fabrique ImageMagick portent, elles, leur date de fabrication : deux images
# qui diffèrent à l'octet sont comparées par leur empreinte de pixels
# (`identify -format %#`), et tenues pour égales si elle est la même. Rien
# d'autre n'est touché.
#
# Avec --recette, b est une construction de recette : ses adresses
# (_config.recette.yml) sont ramenées à celles de la production avant la
# comparaison. Si le résultat est vide, la recette ne diffère de la production
# QUE par ces adresses.
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "usage : $0 <construction-a> <construction-b> [--recette]" >&2
  exit 2
fi
copie=$(mktemp -d "${TMPDIR:-/tmp}/luminose-comparaison.XXXXXX")
trap 'rm -rf "$copie"' EXIT
cp -R "$1" "$copie/a"
cp -R "$2" "$copie/b"

normaliser() {
  grep -rlZE '\?v=[0-9]{10}|<lastmod>' "$1" | xargs -0 -r sed -i -E \
    -e 's/\?v=[0-9]{10}/?v=HEURE/g' \
    -e 's#<lastmod>[^<]*</lastmod>#<lastmod>HEURE</lastmod>#g'
}
normaliser "$copie/a"
normaliser "$copie/b"

# Les images : mêmes pixels, même image.
while IFS= read -r -d '' chemin; do
  relatif=${chemin#"$copie/a/"}
  autre="$copie/b/$relatif"
  [[ -f "$autre" ]] || continue
  cmp -s "$chemin" "$autre" && continue
  if [[ "$(identify -format '%#' "$chemin" 2>/dev/null)" == "$(identify -format '%#' "$autre" 2>/dev/null)" ]]; then
    cp "$chemin" "$autre"
  fi
done < <(find "$copie/a" -type f \( -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' -o -name '*.webp' -o -name '*.gif' \) -print0)

if [[ "${3:-}" == "--recette" ]]; then
  grep -rlZE 'recette\.luminose\.fr' "$copie/b" | xargs -0 -r sed -i -E \
    -e 's#https://api-recette\.luminose\.fr#https://api.luminose.fr#g' \
    -e 's#https://recette\.luminose\.fr#https://www.luminose.fr#g' \
    -e 's#recette\.luminose\.fr#www.luminose.fr#g'
fi

if diff -r "$copie/a" "$copie/b"; then
  echo "comparer : identiques ($(find "$1" -type f | wc -l | tr -d ' ') fichiers)"
fi
