class PageDrop < Liquid::Drop
    def initialize(page)
      @page = page
    end
  
    def inscription
      estLienExterne = false
      if @page.data['url_inscription'] != nil
        urlProtocol = @page.data['url_inscription'].split('://').first
        if (urlProtocol == 'https' or urlProtocol == 'http')
          estLienExterne = true
        end
      end
      if estLienExterne 
        output = '<a href="' + @page.data['url_inscription'] + '" target="_blank" class="button is-primary">S\'inscrire</a>'
      else
        if @page.data['url_inscription'] == nil or @page.data['url_inscription'] == ''
          output = '<a href="/respiration-holotropique/inscription-etape-1.html?notion_page_id=' + @page.data['notion_page_id'] + '" class="button is-primary">S\'inscrire</a>'
        else
          output = '<a href="' + @page.data['url_inscription'] + '" class="button is-primary">S\'inscrire</a>'
        end
      end
      output
    end
end

Jekyll::Hooks.register :documents, :post_init do |document|
  # Vérifiez que le document appartient à la collection "evenements"
  if document.collection.label == 'evenements'
    # Associez le Drop personnalisé au document
    document.data['boutons_evenements'] = PageDrop.new(document)
    #Jekyll.logger.info "DEBUG", "Drop ajouté à un événement : #{document.path}"
  end
end