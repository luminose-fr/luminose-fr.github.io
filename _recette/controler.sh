#!/usr/bin/env bash
# Contrôle la recette en ligne : fermée, non indexée, inerte, reconnaissable,
# et seule à répondre. Le mot de passe n'apparaît dans aucune sortie.
#
#   _recette/controler.sh                    la recette, https://recette.luminose.fr
#   _recette/controler.sh --local <origine>  un `wrangler dev`, par exemple http://localhost:8790
#
# Le mot de passe est demandé au clavier, sans écho ; à défaut de clavier, il
# est lu dans RECETTE_MOT_DE_PASSE. Il ne passe jamais dans la ligne de commande
# de curl (visible de `ps`) : curl le lit sur son entrée.
#
# En ligne, le contrôle vérifie aussi que les adresses workers.dev, d'aperçu et
# de version ne répondent pas, et que la production est inchangée. Il lit pour
# cela le sous-domaine workers.dev et la dernière version par l'API de
# Cloudflare (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID). En local, ces
# contrôles-là sont sautés, et le contrôle le dit.
#
# Sortie 0 si tout passe, 1 sinon.
set -uo pipefail

ici=$(cd "$(dirname "$0")" && pwd)
NOM=luminose-site-recette
local=0
origine=https://recette.luminose.fr
if [[ "${1:-}" == "--local" ]]; then
  local=1
  origine=${2:?"--local demande une origine, par exemple http://localhost:8790"}
fi

if [[ -t 0 ]]; then
  read -rsp "Mot de passe de la recette : " mdp </dev/tty
  echo
else
  mdp=${RECETTE_MOT_DE_PASSE:-}
fi
if [[ -z "$mdp" ]]; then
  echo "controler : il faut le mot de passe de la recette." >&2
  exit 2
fi

travail=$(mktemp -d "${TMPDIR:-/tmp}/luminose-controle.XXXXXX")
trap 'rm -rf "$travail"' EXIT
journal="$travail/journal"
: >"$journal"
echecs=0
reussis=0

dire() { printf '%s\n' "$*" | tee -a "$journal"; }
ok() { reussis=$((reussis + 1)); dire "  ok    $*"; }
ko() { echecs=$((echecs + 1)); dire "  ÉCHEC $*"; }

# curl, sans mot de passe : statut, en-têtes et corps dans $travail.
nu() {
  curl -sS -o "$travail/corps" -D "$travail/entetes" -w '%{http_code}' --max-time 20 "$@" 2>>"$travail/erreurs" || true
}
# curl, avec le mot de passe, lu par curl sur son entrée (-K -).
echapper() { local s=${1//\\/\\\\}; printf '%s' "${s//\"/\\\"}"; }
avec() {
  printf 'user = "recette:%s"\n' "$(echapper "$mdp")" | nu -K - "$@"
}
entete() { grep -i "^$1:" "$travail/entetes" | head -1 | cut -d' ' -f2- | tr -d '\r'; }
attendre() { # attendre <attendu> <obtenu> <libellé>
  if [[ "$1" == "$2" ]]; then ok "$3"; else ko "$3 — attendu « $1 », obtenu « $2 »"; fi
}

dire "Contrôle de $origine"

# ─── 1. Fermée ──────────────────────────────────────────────────────────────
dire "Fermée"
for chemin in / /robots.txt /favicon.ico /florent-jaouali /n-existe-pas; do
  attendre 401 "$(nu "$origine$chemin")" "sans mot de passe : $chemin → 401"
done
attendre 401 "$(printf 'user = "recette:faux-%s"\n' "$RANDOM" | nu -K - "$origine/")" "mauvais mot de passe → 401"
attendre 401 "$(printf 'user = "autre:%s"\n' "$(echapper "$mdp")" | nu -K - "$origine/")" "mauvais identifiant → 401"
attendre 401 "$(nu "$origine/favicon.ico")" "le même fichier, sans le mot de passe → 401"
attendre 200 "$(avec "$origine/favicon.ico")" "le même fichier, avec le mot de passe → 200"

# ─── 2. Les adresses de GitHub Pages ────────────────────────────────────────
dire "Adresses"
adresse() { # adresse <chemin> <statut> <Location attendue ou -> <texte attendu dans le corps>
  local statut location
  statut=$(avec "$origine$1")
  location=$(entete location)
  attendre "$2" "$statut" "$1 → $2"
  local redirection=$3
  [[ "$redirection" == - ]] && redirection=''
  attendre "$redirection" "$location" "$1 : redirection « ${redirection:-aucune} »"
  if [[ -n "$4" ]] && ! grep -q -- "$4" "$travail/corps"; then ko "$1 : le contenu attendu (« $4 ») manque"; fi
}
adresse / 200 - '<html'
adresse /index.html 200 - '<html'
adresse /florent-jaouali.html 200 - 'Florent'
cp "$travail/corps" "$travail/page-html"
adresse /florent-jaouali 200 - 'Florent'
if cmp -s "$travail/corps" "$travail/page-html"; then ok "/florent-jaouali sert /florent-jaouali.html"; else ko "/florent-jaouali ne sert pas /florent-jaouali.html"; fi
adresse /respiration-holotropique 200 - 'holotropique'
adresse /respiration-holotropique/ 404 - ''
adresse /respiration-holotropique/index.html 404 - ''
adresse /n-existe-pas 404 - ''
if grep -q 'luminose-recette' "$travail/corps"; then ok "la page 404 est celle du site, réécrite"; else ko "la page 404 n'est pas réécrite"; fi
adresse /css/main.css 200 - ''
adresse /css/main.css/ 404 - ''

# ─── 3. robots.txt et sitemap ───────────────────────────────────────────────
dire "Indexation"
avec "$origine/robots.txt" >/dev/null
attendre "$(printf 'User-agent: *\nDisallow: /')" "$(cat "$travail/corps")" "robots.txt interdit tout"
attendre 404 "$(avec "$origine/sitemap.xml")" "sitemap.xml → 404"

# ─── 4. En-têtes, balise robots, marque ─────────────────────────────────────
dire "En-têtes et marque"
for cas in "/:avec" "/n-existe-pas:avec" "/css/main.css:avec" "/:nu"; do
  chemin=${cas%%:*}
  if [[ ${cas##*:} == avec ]]; then statut=$(avec "$origine$chemin"); else statut=$(nu "$origine$chemin"); fi
  attendre "noindex, nofollow" "$(entete x-robots-tag)" "$chemin ($statut) : X-Robots-Tag"
  attendre "no-store" "$(entete cache-control)" "$chemin ($statut) : Cache-Control"
  csp=$(entete content-security-policy)
  if [[ "$csp" == "default-src 'none';"* ]]; then ok "$chemin ($statut) : politique de sécurité appliquée"; else ko "$chemin ($statut) : politique de sécurité absente ou non appliquée"; fi
done
if [[ -n "$(entete content-security-policy-report-only)" ]]; then ko "une politique en simple compte rendu traîne"; fi
for service in calendly stripe stancer make.com sibforms googletagmanager mixpanel doubleclick fonts.net; do
  if [[ "$csp" == *"$service"* ]]; then ko "la politique ouvre $service"; fi
done
avec "$origine/" >/dev/null
if grep -q '<meta name="robots" content="noindex, nofollow">' "$travail/corps"; then ok "la balise robots est dans la page"; else ko "la balise robots manque"; fi
if grep -q 'id="luminose-recette"' "$travail/corps"; then ok "la marque « Recette » est dans la page"; else ko "la marque « Recette » manque"; fi
# Les liens seulement : les scripts et feuilles de Calendly restent écrits dans
# la page, et c'est la politique qui les bloque (la marque les compte).
if grep -oE '<a [^>]*>' "$travail/corps" | grep -qE 'href="https?://[^"]*(calendly\.com|stancer\.com|stripe\.com|make\.com|sibforms\.com)'; then ko "un lien vers un service reste actif"; else ok "aucun lien actif vers un service"; fi

# ─── 5. Les autres adresses du Worker ───────────────────────────────────────
dire "Les autres adresses"
silencieuse() { # silencieuse <url> <libellé> : ni la page, ni un 2xx/3xx
  local statut
  statut=$(avec "$1")
  if [[ "$statut" =~ ^[23] ]] || grep -q 'luminose-recette' "$travail/corps" 2>/dev/null; then
    ko "$2 répond ($statut)"
  else
    ok "$2 ne répond pas (${statut:-000})"
  fi
}
if [[ $local -eq 1 ]]; then
  dire "  sauté workers.dev, aperçu, version : en local, ils n'existent pas"
elif [[ -z "${CLOUDFLARE_API_TOKEN:-}" || -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]]; then
  ko "workers.dev, aperçu, version : CLOUDFLARE_API_TOKEN et CLOUDFLARE_ACCOUNT_ID manquent, non vérifié"
else
  api() { curl -sS --max-time 20 -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/$1"; }
  sous=$(api workers/subdomain | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).result.subdomain||"")}catch{console.log("")}})')
  version=$(cd "$ici" && npx --no-install wrangler versions list --json 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const v=JSON.parse(s);console.log((v.at(-1)||v[0]).id.slice(0,8))}catch{console.log("")}})')
  if [[ -z "$sous" ]]; then
    ko "le sous-domaine workers.dev n'a pas pu être lu"
  else
    silencieuse "https://$NOM.$sous.workers.dev/" "workers.dev"
    [[ -n "$version" ]] && silencieuse "https://$version-$NOM.$sous.workers.dev/" "l'adresse de la version $version" || ko "la dernière version n'a pas pu être lue"
    silencieuse "https://recette-$NOM.$sous.workers.dev/" "une adresse d'aperçu"
  fi
fi

# ─── 6. La production ───────────────────────────────────────────────────────
dire "La production"
if [[ $local -eq 1 ]]; then
  dire "  sauté la production : en local, on ne la contacte pas"
else
  attendre 200 "$(nu https://www.luminose.fr/)" "www.luminose.fr répond"
  if [[ -z "$(entete x-robots-tag)" ]]; then ok "la production n'a pas d'X-Robots-Tag"; else ko "la production porte un X-Robots-Tag : $(entete x-robots-tag)"; fi
  if grep -q 'luminose-recette\|recette\.luminose\.fr' "$travail/corps"; then ko "la production mentionne la recette"; else ok "la production ne mentionne pas la recette"; fi
  nu https://www.luminose.fr/robots.txt >/dev/null
  if cmp -s "$travail/corps" "$ici/../robots.txt"; then ok "le robots.txt de la production est celui du dépôt"; else ko "le robots.txt de la production a changé"; fi
fi

# ─── Le mot de passe ne paraît nulle part ───────────────────────────────────
if grep -qF -- "$mdp" "$journal" "$travail/erreurs" 2>/dev/null; then
  ko "le mot de passe paraît dans une sortie"
fi

dire ""
dire "$reussis contrôles réussis, $echecs en échec."
[[ $echecs -eq 0 ]]
