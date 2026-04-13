# _plugins/image_variants_generator.rb
#
# Jekyll Generator — génère automatiquement des variantes responsives
# à chaque build : plusieurs largeurs + WebP pour chaque.
#
# Workflow :
#   1. Déposer l'image HD dans images/ avec le suffixe @2x
#   2. Lancer `jekyll build` → les variantes sont générées automatiquement
#
# Prérequis : gem "mini_magick" dans le Gemfile
#             ImageMagick installé (avec support WebP)
#
# Configuration optionnelle dans _config.yml :
#   image_variants:
#     widths: [400, 800, 1200]  # largeurs cibles en pixels
#     webp_quality: 80          # qualité WebP (0-100)
#     jpg_quality: 85           # qualité JPG pour les redimensionnements
#     skip: false               # mettre à true pour désactiver
#
# Pour chaque image source@2x, le generator crée :
#   - Des variantes redimensionnées : image-400w.jpg, image-800w.jpg, image-1200w.jpg
#   - Des variantes WebP pour chaque : image-400w.webp, image-800w.webp, image-1200w.webp
#   - Une variante WebP pleine résolution : image@2x.webp
#   - Une variante à source_width/2 (équivalent "1x") si elle n'existe pas déjà
#
# Les métadonnées (dimensions source, largeurs disponibles) sont stockées dans
# site.data["image_variants"] pour être lues par le tag {% img_optimized %}.

require 'fileutils'

begin
  require 'mini_magick'
rescue LoadError
  Jekyll.logger.warn "ImageVariants:", "gem 'mini_magick' non trouvé. " \
    "Ajoutez `gem \"mini_magick\"` au Gemfile et lancez `bundle install`."
end

module Jekyll
  class ImageVariantsGenerator < Generator
    safe true
    priority :high

    SUPPORTED_EXTENSIONS = %w[.jpg .jpeg .png].freeze
    DEFAULT_WIDTHS = [400, 800, 1200].freeze

    def generate(site)
      unless defined?(MiniMagick)
        Jekyll.logger.warn "ImageVariants:", "Génération désactivée (mini_magick absent)."
        return
      end

      config = site.config["image_variants"] || {}
      return if config["skip"]

      @configured_widths = (config["widths"] || DEFAULT_WIDTHS).sort
      @webp_quality      = config["webp_quality"] || 80
      @jpg_quality       = config["jpg_quality"] || 85

      images_dir = File.join(site.source, "images")
      return unless File.directory?(images_dir)

      site.data["image_variants"] ||= {}

      retina_files = Dir.glob(File.join(images_dir, "**", "*@2x.*")).select do |f|
        SUPPORTED_EXTENSIONS.include?(File.extname(f).downcase)
      end

      if retina_files.empty?
        Jekyll.logger.info "ImageVariants:", "Aucune image @2x trouvée."
        return
      end

      count = 0

      retina_files.sort.each do |file_2x|
        dir      = File.dirname(file_2x)
        filename = File.basename(file_2x)
        ext      = File.extname(filename)
        base_2x  = File.basename(filename, ext)  # ex: "oracle-ressources-boite@2x"
        base     = base_2x.sub(/@2x\z/, '')      # ex: "oracle-ressources-boite"

        # Dimensions de la source
        source = MiniMagick::Image.open(file_2x)
        source_width  = source.width
        source_height = source.height

        # Clé relative pour les métadonnées : "contenus/oracle-ressources-boite.jpg"
        images_root = File.join(site.source, "images")
        relative_dir = dir.sub(images_root, "").sub(/\A\//, "")
        meta_key = relative_dir.empty? ? "#{base}#{ext}" : "#{relative_dir}/#{base}#{ext}"

        # Largeurs cibles : les largeurs configurées + la taille "1x" (source/2)
        # On ne garde que celles strictement inférieures à la source (pas d'upscale)
        half_width = source_width / 2
        target_widths = (@configured_widths + [half_width])
          .select { |w| w < source_width }
          .sort
          .uniq

        # --- Générer les variantes par largeur ---
        target_widths.each do |tw|
          variant_orig = File.join(dir, "#{base}-#{tw}w#{ext}")
          variant_webp = File.join(dir, "#{base}-#{tw}w.webp")

          if needs_update?(file_2x, variant_orig)
            Jekyll.logger.info "ImageVariants:", "#{tw}w ← #{meta_key}"
            resize_image(file_2x, variant_orig, tw, ext)
            count += 1
          end

          if needs_update?(file_2x, variant_webp)
            Jekyll.logger.info "ImageVariants:", "#{tw}w.webp ← #{meta_key}"
            resize_to_webp(file_2x, variant_webp, tw)
            count += 1
          end

          add_static_file(site, variant_orig)
          add_static_file(site, variant_webp)
        end

        # --- WebP de la source @2x (pleine résolution) ---
        webp_2x = File.join(dir, "#{base_2x}.webp")
        if needs_update?(file_2x, webp_2x)
          Jekyll.logger.info "ImageVariants:", "WebP source ← #{meta_key}"
          convert_to_webp(file_2x, webp_2x)
          count += 1
        end
        add_static_file(site, webp_2x)

        # --- Stocker les métadonnées ---
        site.data["image_variants"][meta_key] = {
          "source_width"  => source_width,
          "source_height" => source_height,
          "widths"        => target_widths
        }
      end

      if count > 0
        Jekyll.logger.info "ImageVariants:", "#{count} fichier(s) généré(s)."
      else
        Jekyll.logger.info "ImageVariants:", "Toutes les variantes sont à jour."
      end
    end

    private

    def needs_update?(source, target)
      return true unless File.exist?(target)
      File.mtime(source) > File.mtime(target)
    end

    def resize_image(source, target, width, ext)
      img = MiniMagick::Image.open(source)
      img.resize "#{width}x"
      img.quality @jpg_quality.to_s if jpg?(ext)
      img.write(target)
    end

    def resize_to_webp(source, target, width)
      img = MiniMagick::Image.open(source)
      img.resize "#{width}x"
      img.format "webp"
      img.quality @webp_quality.to_s
      img.write(target)
    end

    def convert_to_webp(source, target)
      img = MiniMagick::Image.open(source)
      img.format "webp"
      img.quality @webp_quality.to_s
      img.write(target)
    end

    def jpg?(ext)
      %w[.jpg .jpeg].include?(ext.downcase)
    end

    def add_static_file(site, path)
      return unless File.exist?(path)
      rel_dir = File.dirname(path).sub("#{site.source}/", "")
      fname   = File.basename(path)
      unless site.static_files.any? { |sf| sf.path == path }
        site.static_files << StaticFile.new(site, site.source, rel_dir, fname)
      end
    end
  end
end
