module Jekyll
module FrenchDates
    MONTHS = {"01" => "janvier", "02" => "février", "03" => "mars",
            "04" => "avril", "05" => "mai", "06" => "juin",
            "07" => "juillet", "08" => "août", "09" => "septembre",
            "10" => "octobre", "11" => "novembre", "12" => "décembre"}

    # http://man7.org/linux/man-pages/man3/strftime.3.html
    def dateFrancaise(date)
        day = time(date).strftime("%e") # leading zero is replaced by a space
        month = time(date).strftime("%m")
        year = time(date).strftime("%Y")
        day+' '+MONTHS[month]+' '+year
    end

    def datePublication(date)
        'Le ' + dateFrancaise(date) + ' à ' + time(date).strftime("%H:%M")
    end
    
    def datePublicationArticle(date)
        'Publié le ' + dateFrancaise(date)
    end
end
end

Liquid::Template.register_filter(Jekyll::FrenchDates)
