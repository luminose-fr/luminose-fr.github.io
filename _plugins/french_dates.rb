module Jekyll
module FrenchDates
    MONTHS = {"01" => "janvier", "02" => "février", "03" => "mars",
            "04" => "avril", "05" => "mai", "06" => "juin",
            "07" => "juillet", "08" => "août", "09" => "septembre",
            "10" => "octobre", "11" => "novembre", "12" => "décembre"}
    DAYS = {"1" => "lundi", "2" => "mardi", "3" => "mercredi",
            "4" => "jeudi", "5" => "vendredi", "6" => "samedi",
            "7" => "dimanche"}

    def estDateFuture(date)
        date = time(date)
        now = time('now')
        if (date > now)
            true
        else
            false
        end
    end
    
            # http://man7.org/linux/man-pages/man3/strftime.3.html
    def dateFrancaise(date)
        day = time(date).strftime("%e") # leading zero is replaced by a space
        month = time(date).strftime("%m")
        year = time(date).strftime("%Y")
        day+' '+MONTHS[month]+' '+year
    end

    def dateEvenement(date)
        date = time(date)
        day         = date.strftime("%e") # leading zero is replaced by a space
        month       = date.strftime("%m")
        year        = date.strftime("%Y")
        '<span class="jour">' + day + '</span><span class="mois-annee">' + capitalize(MONTHS[month]) + ' <span class="annee">' + year + '</span></span>'
    end

    def dateEvenementTexte(date)
        date = time(date)
        day         = date.strftime("%e") # leading zero is replaced by a space
        month       = date.strftime("%m")
        year        = date.strftime("%Y")
        day + ' ' + capitalize(MONTHS[month]) + ' ' + year
    end

    def jourEvenement(date)
        date = time(date)
        day_number  = date.strftime("%u")
        day         = date.strftime("%e") # leading zero is replaced by a space
        month       = date.strftime("%m")
        year        = date.strftime("%Y")
        capitalize(DAYS[day_number]) + ' ' + day + ' ' + capitalize(MONTHS[month]) + ' ' + year
    end

    def heure(date)
        #date = date.to_s.split('+')[0]
        time(date).strftime("%H:%M")
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
