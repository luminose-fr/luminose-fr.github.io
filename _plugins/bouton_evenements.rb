class BoutonEvenementsTag < Liquid::Tag
  def initialize(tag_name, input, tokens)
	super
	@input = input
  end

  def render(context)

  default_classes = "button bt-evenements is-white is-purple-bordered "
	extra_classes = ''
  href = context.environments.first["site"]["baseurl"] + "/evenements.html"
  
	if !@input.empty?
		input_split = split_params(@input)
		extra_classes_array = input_split[0].strip.split(" ")		
    extra_classes = extra_classes_array.join(' ')
	end
  
  if context.environments.first["page"]["section"] == "evenements" 
      extra_classes += ' is-active'
  end
	
	# Write the output HTML string
	output = '<a class="' + default_classes + ' ' + extra_classes + '" '
	output += 'href="' + href + '" '

	output += '>'
	output += 'Planning des évènements'
	output += '</a>'

	# Render it on the page by returning it
	return output;
  end
  
	def split_params(params)
		params.split("|")
	end
end

Liquid::Template.register_tag('bouton_evenements', BoutonEvenementsTag)