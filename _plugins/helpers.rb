module Jekyll
    module Helpers
        CATEGORIES_EVENEMENTS = {
                "meditation" => "Méditation", 
                "auto-hypnose" => "Auto-hypnose", 
                "respiration-holotropique" => "Respiration holotropique"}
    
        def nomCategorieEvenement(categorie)
            CATEGORIES_EVENEMENTS[categorie]
        end

    end
end
    
Liquid::Template.register_filter(Jekyll::Helpers)
    