# _plugins/img_optimized.rb
#
# Tag Liquid pour générer un <picture> optimisé avec WebP + srcset responsif.
#
# ============================================================================
# AJOUTER UNE NOUVELLE IMAGE — Guide rapide
# ============================================================================
#
# 1. PRÉPARER L'IMAGE SOURCE
#
#    Format :    JPG (photos) ou PNG (logos, illustrations avec transparence)
#    Nommage :   mon-image@2x.jpg   ← le suffixe @2x est OBLIGATOIRE
#    Taille :    2× la largeur d'affichage maximale souhaitée
#                Ex : si l'image s'affiche à 637px max → fournir ~1274px de large
#                Recommandation : entre 1200px et 2400px de large
#    Qualité :   Maximale (90-100% pour JPG). Le plugin compresse ensuite.
#                Ne pas pré-compresser, sinon double compression = artefacts.
#
# 2. DÉPOSER LE FICHIER
#
#    Placer le fichier dans le dossier images/ (ou un sous-dossier) :
#      images/contenus/mon-image@2x.jpg
#
#    Ne fournir QUE la version @2x. Le plugin image_variants_generator.rb
#    génère automatiquement toutes les variantes au build :
#      mon-image-400w.jpg, mon-image-800w.jpg, mon-image-1200w.jpg
#      mon-image-400w.webp, mon-image-800w.webp, mon-image-1200w.webp
#      mon-image@2x.webp
#
# 3. UTILISER DANS LE TEMPLATE
#
#    Le chemin dans le tag est SANS @2x et relatif à /images/ :
#
#      {% img_optimized "contenus/mon-image.jpg"
#         alt="Description de l'image"
#         class="fill"
#         width=637 height=400 %}
#
#    width et height sont optionnels (auto-détectés si omis) mais recommandés
#    pour éviter le layout shift (CLS).
#
# ============================================================================
# Paramètres du tag
# ============================================================================
#
#   alt     — (obligatoire) texte alternatif
#   class   — (optionnel) classe(s) CSS
#   width   — (optionnel) largeur d'affichage CSS en pixels
#   height  — (optionnel) hauteur d'affichage CSS en pixels
#   sizes   — (optionnel) attribut sizes pour le srcset responsif
#             Défaut : "(max-width: 768px) 100vw, {width}px" si width fourni,
#                      sinon "100vw"
#   loading — (optionnel) "lazy" ou "eager", défaut "lazy"
#
# Les dimensions et variantes disponibles sont lues depuis les métadonnées
# générées par le plugin image_variants_generator.rb (site.data["image_variants"]).
# Si aucune métadonnée n'est trouvée, le tag produit un fallback simple.

module Jekyll
  class ImgOptimizedTag < Liquid::Tag
    SYNTAX = /\A\s*"([^"]+)"\s*(.*)\z/m

    def initialize(tag_name, markup, tokens)
      super
      if markup =~ SYNTAX
        @img_path = Regexp.last_match(1)
        @raw_attrs = Regexp.last_match(2).strip
      else
        raise SyntaxError, 'img_optimized attend : {% img_optimized "chemin/image.ext" alt="..." %}'
      end
    end

    def render(context)
      site = context.registers[:site]
      attrs = parse_attributes(@raw_attrs, context)

      # Résoudre les variables Liquid dans le chemin si nécessaire
      img_path = @img_path
      if img_path.include?("{{")
        img_path = Liquid::Template.parse(img_path).render(context)
      end

      base_dir    = "/images/"
      ext         = File.extname(img_path)
      base_no_ext = img_path.chomp(ext)

      # Extraire les attributs connus
      width     = attrs.delete("width")
      height    = attrs.delete("height")
      alt       = attrs.delete("alt") || ""
      css_class = attrs.delete("class")
      loading   = attrs.delete("loading") || "lazy"
      sizes     = attrs.delete("sizes")

      # Métadonnées du generator (dimensions source + largeurs disponibles)
      variants_data = site.data&.dig("image_variants", img_path)

      # Auto-détecter les dimensions depuis les métadonnées si non fournies
      # La source est @2x, donc les dimensions d'affichage = source / 2
      if variants_data && (width.nil? || height.nil?)
        sw = variants_data["source_width"]
        sh = variants_data["source_height"]
        if sw && sh
          width  ||= sw / 2
          height ||= sh / 2
        end
      end

      # Auto-calculer sizes si non fourni
      sizes ||= width ? "(max-width: 768px) 100vw, #{width}px" : "100vw"

      # Choisir le mode de rendu
      if variants_data && variants_data["widths"] && !variants_data["widths"].empty?
        render_responsive(base_dir, base_no_ext, ext, variants_data, sizes,
                          alt, css_class, width, height, loading, attrs)
      else
        render_fallback(base_dir, base_no_ext, ext, alt, css_class,
                        width, height, loading, attrs)
      end
    end

    private

    # Rendu avec variantes responsives (srcset en descripteurs w)
    def render_responsive(base_dir, base_no_ext, ext, data, sizes,
                          alt, css_class, width, height, loading, attrs)
      widths       = data["widths"]
      source_width = data["source_width"]

      # Construire le srcset : variantes redimensionnées + source @2x pleine résolution
      webp_entries = widths.map { |w| "#{base_dir}#{base_no_ext}-#{w}w.webp #{w}w" }
      webp_entries << "#{base_dir}#{base_no_ext}@2x.webp #{source_width}w"

      orig_entries = widths.map { |w| "#{base_dir}#{base_no_ext}-#{w}w#{ext} #{w}w" }
      orig_entries << "#{base_dir}#{base_no_ext}@2x#{ext} #{source_width}w"

      # Fallback src : variante la plus proche de la largeur d'affichage
      display_w = width.to_i > 0 ? width.to_i : 800
      src_width = widths.min_by { |w| (w - display_w).abs }
      src = "#{base_dir}#{base_no_ext}-#{src_width}w#{ext}"

      build_picture_html(webp_entries, orig_entries, src, sizes,
                         alt, css_class, width, height, loading, attrs)
    end

    # Fallback sans variantes (quand le generator n'a pas tourné)
    def render_fallback(base_dir, base_no_ext, ext, alt, css_class,
                        width, height, loading, attrs)
      path_2x      = "#{base_dir}#{base_no_ext}@2x#{ext}"
      path_2x_webp = "#{base_dir}#{base_no_ext}@2x.webp"

      webp_entries = [path_2x_webp]
      orig_entries = [path_2x]

      build_picture_html(webp_entries, orig_entries, path_2x, nil,
                         alt, css_class, width, height, loading, attrs)
    end

    def build_picture_html(webp_entries, orig_entries, src, sizes,
                           alt, css_class, width, height, loading, attrs)
      webp_srcset = webp_entries.join(",\n            ")
      orig_srcset = orig_entries.join(",\n            ")

      html = %(<picture>\n)
      html << %(  <source\n)
      html << %(    srcset="#{webp_srcset}"\n)
      html << %(    sizes="#{sizes}"\n) if sizes
      html << %(    type="image/webp">\n)
      html << %(  <img\n)
      html << %(    src="#{src}"\n)
      html << %(    srcset="#{orig_srcset}"\n)
      html << %(    sizes="#{sizes}"\n) if sizes
      html << %(    alt="#{alt}"\n)
      html << %(    class="#{css_class}"\n) if css_class
      html << %(    width="#{width}"\n) if width
      html << %(    height="#{height}"\n) if height
      html << %(    loading="#{loading}"\n)

      attrs.each do |key, value|
        html << %(    #{key}="#{value}"\n)
      end

      html << %(  >\n)
      html << %(</picture>)
      html
    end

    def parse_attributes(raw, context)
      attrs = {}
      raw.scan(/([\w-]+)\s*=\s*(?:"([^"]*)"|(\S+))/) do |key, quoted_val, bare_val|
        value = quoted_val || bare_val
        if value&.start_with?("{{")
          value = Liquid::Template.parse(value).render(context)
        end
        attrs[key] = value
      end
      attrs
    end
  end
end

Liquid::Template.register_tag("img_optimized", Jekyll::ImgOptimizedTag)
