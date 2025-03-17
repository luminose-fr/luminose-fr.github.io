module Jekyll
    module Helpers
        CATEGORIES_EVENEMENTS = {
                "meditation" => "Méditation", 
                "hypnose" => "Hypnose", 
                "respiration-holotropique" => "Respiration holotropique"}
    
        def nomCategorieEvenement(categorie)
            CATEGORIES_EVENEMENTS[categorie]
        end

        def lieuEvenement(lieu)
            if lieu != 'En ligne'
                "à #{lieu}"
            else
                "En ligne"
            end
        end
    end
end
    
Liquid::Template.register_filter(Jekyll::Helpers)
    