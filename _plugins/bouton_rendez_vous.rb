class BoutonRendezVousTag < Liquid::Tag
  def initialize(tag_name, input, tokens)
	super
	@input = input
  end

  def render(context)
	doctolib = false
	doctolib_url = "https://www.doctolib.fr/hypnotherapeute/villefranche-de-lauragais/florent-jaouali?utm_medium=referral&amp;utm_campaign=website-button&amp;utm_content=option-2&amp;utm_term=florent-jaouali&amp;utm_source=florent-jaouali-website-button"
	
	  
	extra_classes = 'is-primary'
	if !@input.empty?
		input_split = split_params(@input)
		extra_classes_array = input_split[0].strip.split(" ")
		if !extra_classes_array.include? 'is-white'
			extra_classes_array.push('is-primary')
		end
		
    	extra_classes = extra_classes_array.join(' ')
	end
	
	if doctolib
		href = doctolib_url
		default_classes = "button"
	else
		href = ""
		default_classes = "button bt-prise-rdv"
	end
	
	# Write the output HTML string
	output = '<a class="' + default_classes + ' ' + extra_classes + '" '
	output += 'href="' + href + '" '
	if doctolib
		output += 'target="_blank" '
	end
	output += '>'
	output += 'Prendre un rendez-vous'
	output += '</a>'

	# Render it on the page by returning it
	return output;
  end
  
	def split_params(params)
		params.split("|")
	end
end

Liquid::Template.register_tag('bouton_rendez_vous', BoutonRendezVousTag)